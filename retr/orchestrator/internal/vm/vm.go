package vm

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/firecracker-microvm/firecracker-go-sdk"
	"github.com/sirupsen/logrus"
)

// State represents the state of a VM
type State string

const (
	StateCreated   State = "created"
	StateStarting  State = "starting"
	StateRunning   State = "running"
	StateStopped   State = "stopped"
	StatePaused    State = "paused"
	StateSuspended State = "suspended"
	StateError     State = "error"
)

// VM represents a Firecracker microVM instance
type VM struct {
	id          string
	config      VMConfig
	vmm         *firecracker.MicroVM
	logger      *logrus.Entry
	state       State
	stateCh     chan State
	firecracker *firecracker.Client
	socketPath  string
}

// Start starts the virtual machine
func (v *VM) Start(ctx context.Context) error {
	v.logger.Info("Starting VM")

	if v.state == StateRunning {
		return nil
	}

	v.setState(StateStarting)

	// Create the VM if it doesn't exist yet
	if v.vmm == nil {
		if err := v.createVM(); err != nil {
			v.setState(StateError)
			return fmt.Errorf("failed to create VM: %w", err)
		}
	}

	// Start the VMM
	if err := v.vmm.StartVM(); err != nil {
		v.setState(StateError)
		return fmt.Errorf("failed to start VMM: %w", err)
	}

	// Wait for the VM to enter the running state
	select {
	case <-ctx.Done():
		return ctx.Err()
	case s := <-v.stateCh:
		if s == StateRunning {
			v.logger.Info("VM started successfully")
			return nil
		}
		return fmt.Errorf("VM entered unexpected state: %s", s)
	}
}

// Stop stops the virtual machine gracefully
func (v *VM) Stop(ctx context.Context) error {
	v.logger.Info("Stopping VM")

	if v.state == StateStopped {
		return nil
	}

	// Attempt graceful shutdown first
	if err := v.vmm.Shutdown(); err != nil {
		v.logger.WithError(err).Warn("Graceful shutdown failed, attempting force stop")
		// Fallback to force stop
		if err := v.vmm.StopVM(); err != nil {
			v.setState(StateError)
			return fmt.Errorf("failed to stop VM: %w", err)
		}
	}

	// Wait for the VM to stop
	select {
	case <-ctx.Done():
		return ctx.Err()
	case s := <-v.stateCh:
		if s == StateStopped {
			v.logger.Info("VM stopped successfully")
			return nil
		}
		return fmt.Errorf("VM entered unexpected state: %s", s)
	}
}

// Pause pauses the virtual machine
func (v *VM) Pause() error {
	v.logger.Info("Pausing VM")

	if v.state != StateRunning {
		return fmt.Errorf("cannot pause VM in state %s", v.state)
	}

	if err := v.vmm.PauseVM(); err != nil {
		return fmt.Errorf("failed to pause VM: %w", err)
	}

	v.setState(StatePaused)
	return nil
}

// Resume resumes a paused virtual machine
func (v *VM) Resume() error {
	v.logger.Info("Resuming VM")

	if v.state != StatePaused {
		return fmt.Errorf("cannot resume VM in state %s", v.state)
	}

	if err := v.vmm.ResumeVM(); err != nil {
		return fmt.Errorf("failed to resume VM: %w", err)
	}

	v.setState(StateRunning)
	return nil
}

// createVM creates the Firecracker microVM instance
func (v *VM) createVM() error {
	v.logger.Info("Creating VM")

	// Create the firecracker socket if it doesn't exist
	if err := os.RemoveAll(v.socketPath); err != nil {
		return fmt.Errorf("failed to remove existing socket: %w", err)
	}

	// Start the firecracker binary
	vmm, err := firecracker.NewMicroVM(
		v.firecracker,
		v.socketPath,
		firecracker.WithLogger(v.logger.Logger),
	)
	if err != nil {
		return fmt.Errorf("failed to create microVM: %w", err)
	}

	v.vmm = vmm

	// Configure the VM
	if err := v.configureVM(); err != nil {
		return fmt.Errorf("failed to configure VM: %w", err)
	}

	return nil
}

// configureVM applies the configuration to the microVM
func (v *VM) configureVM() error {
	v.logger.Info("Configuring VM")

	// Set boot source
	if err := v.vmm.SetBootSource(*v.config.BootSource); err != nil {
		return fmt.Errorf("failed to set boot source: %w", err)
	}

	// Set drives
	for _, drive := range v.config.Drives {
		if err := v.vmm.AddDrive(drive); err != nil {
			return fmt.Errorf("failed to add drive %s: %w", drive.PathOnHost, err)
		}
	}

	// Set network interfaces
	for _, netIf := range v.config.NetworkInterfaces {
		if err := v.vmm.SetNetworkInterface(netIf); err != nil {
			return fmt.Errorf("failed to set network interface %s: %w", netIf.IfaceID, err)
		}
	}

	// Set machine configuration
	if err := v.vmm.SetMachineConfiguration(v.config.MachineConfig); err != nil {
		return fmt.Errorf("failed to set machine configuration: %w", err)
	}

	return nil
}

// monitorState monitors the VM state changes by inspecting the firecracker socket
func (v *VM) monitorState(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Check VM state via the metadata endpoint
			if v.vmm != nil {
				if mmd, err := v.vmm.GetMMIFace(); err == nil {
					newState := State(strings.ToLower(string(mmd.VMMState)))
					if newState != v.state {
						v.logger.WithFields(logrus.Fields{
							"old_state": v.state,
							"new_state": newState,
						}).Debug("VM state changed")
						v.setState(newState)
					}
				}
			}
		}
	}
}

// setState updates the VM state and sends it to the state channel
func (v *VM) setState(state State) {
	if v.state == state {
		return
	}
	v.state = state
	select {
	case v.stateCh <- state:
	default:
		// Don't block if the channel is full
	}
}

// GetState returns the current state of the VM
func (v *VM) GetState() State {
	return v.state
}

// ResizeVM adjusts the CPU and memory allocation of the VM
func (v *VM) ResizeVM(vcpuCount uint64, memSizeMB uint64) error {
	v.logger.WithFields(logrus.Fields{
		"vcpu_count": vcpuCount,
		"mem_size_mb": memSizeMB,
	}).Info("Resizing VM")

	if v.state != StateRunning {
		return fmt.Errorf("cannot resize VM in state %s", v.state)
	}

	// Update VM config
	v.config.CPUCount = vcpuCount
	v.config.MemSizeMB = memSizeMB

	// Update machine configuration
	mc := firecracker.NewMachineConfiguration(vcpuCount)
	mc.MemorySizeMiB = memSizeMB

	if err := v.vmm.SetMachineConfiguration(mc); err != nil {
		return fmt.Errorf("failed to update machine configuration: %w", err)
	}

	return nil
}

// GetVMMetrics returns basic metrics about the VM's performance
func (v *VM) GetVMMetrics() (*firecracker.VMMetrics, error) {
	if v.state != StateRunning {
		return nil, fmt.Errorf("cannot get metrics from VM in state %s", v.state)
	}

	metrics, err := v.vmm.GetInstanceInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to get VM metrics: %w", err)
	}
	return metrics, nil
}