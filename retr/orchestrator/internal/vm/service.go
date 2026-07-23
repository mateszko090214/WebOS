package vm

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"

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

// VMService manages Firecracker microVMs for application isolation
type VMService struct {
	logger *logrus.Entry
	vms    map[string]*VM
	mutex  map[string]*sync.Mutex
	globalMu sync.RWMutex
}

// NewVMService creates a new VM service instance
func NewVMService(logger *logrus.FieldLogger) *VMService {
	return &VMService{
		logger: logger.WithField("component", "vm_service"),
		vms:    make(map[string]*VM),
		mutex:  make(map[string]*sync.Mutex),
	}
}

// CreateVM creates a new microVM with the specified configuration
func (s *VMService) CreateVM(ctx context.Context, vmID string, config VMConfig) (*VM, error) {
	s.globalMu.Lock()
	defer s.globalMu.Unlock()

	if _, exists := s.vms[vmID]; exists {
		return nil, fmt.Errorf("vm %s already exists", vmID)
	}

	// Create mutex for this VM
	s.mutex[vmID] = &sync.Mutex{}

	// Create socket path for communication with Firecracker
	socketPath := filepath.Join(os.TempDir(), "firecracker-"+vmID+".socket")

	// Create Firecracker client
	fcClient := firecracker.NewClient(socketPath)

	// Create VM instance
	vm := &VM{
		id:          vmID,
		config:      config,
		logger:      s.logger.WithField("vm_id", vmID),
		state:       StateCreated,
		stateCh:     make(chan State, 10),
		firecracker: fcClient,
		socketPath:  socketPath,
	}

	s.vms[vmID] = vm

	// Start VM state monitoring
	go vm.monitorState(ctx)

	return vm, nil
}

// StartVM starts the specified virtual machine
func (s *VMService) StartVM(ctx context.Context, vmID string) error {
	s.globalMu.RLock()
	vm, exists := s.vms[vmID]
	s.globalMu.RUnlock()
	if !exists {
		return fmt.Errorf("vm %s not found", vmID)
	}

	s.mutex[vmID].Lock()
	defer s.mutex[vmID].Unlock()

	return vm.Start(ctx)
}

// StopVM stops the specified virtual machine
func (s *VMService) StopVM(ctx context.Context, vmID string) error {
	s.globalMu.RLock()
	vm, exists := s.vms[vmID]
	s.globalMu.RUnlock()
	if !exists {
		return fmt.Errorf("vm %s not found", vmID)
	}

	s.mutex[vmID].Lock()
	defer s.mutex[vmID].Unlock()

	return vm.Stop(ctx)
}

// GetVM returns the VM instance by ID
func (s *VMService) GetVM(vmID string) (*VM, error) {
	s.globalMu.RLock()
	defer s.globalMu.RUnlock()

	vm, exists := s.vms[vmID]
	if !exists {
		return nil, fmt.Errorf("vm %s not found", vmID)
	}
	return vm, nil
}

// ListVMs returns all managed VMs
func (s *VMService) ListVMs() []*VM {
	s.globalMu.RLock()
	defer s.globalMu.RUnlock()

	vms := make([]*VM, 0, len(s.vms))
	for _, vm := range s.vms {
		vms = append(vms, vm)
	}
	return vms
}

// DeleteVM removes the VM from management and cleans up resources
func (s *VMService) DeleteVM(ctx context.Context, vmID string) error {
	s.globalMu.Lock()
	vm, exists := s.vms[vmID]
	if !exists {
		s.globalMu.Unlock()
		return fmt.Errorf("vm %s not found", vmID)
	}
	delete(s.vms, vmID)
	delete(s.mutex, vmID)
	s.globalMu.Unlock()

	// Stop the VM if it's running
	if err := s.StopVM(ctx, vmID); err != nil {
		return err
	}

	// Clean up socket file
	if err := os.Remove(vm.socketPath); err != nil && !os.IsNotExist(err) {
		vm.logger.WithError(err).Warn("failed to remove socket file")
	}

	return nil
}