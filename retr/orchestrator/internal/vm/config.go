package vm

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"

	"github.com/firecracker-microvm/firecracker-go-sdk"
)

// DefaultKernelImagePath is the default path to the kernel image
const DefaultKernelImagePath = "/usr/local/share/firecracker-kernel/vmlinux.bin"

// DefaultRootDrivePath is the default path to the root filesystem image
const DefaultRootDrivePath = "/var/lib/firecracker/ubuntu-rootfs.ext4"

// NewDefaultVMConfig creates a VM configuration with sensible defaults
func NewDefaultVMConfig(vmID string) (*VMConfig, error) {
	kernelImage := DefaultKernelImagePath
	rootDrive := DefaultRootDrivePath

	// Check if the kernel image exists
	if _, err := os.Stat(kernelImage); os.IsNotExist(err) {
		return nil, fmt.Errorf("kernel image not found at %s", kernelImage)
	}

	// Check if the root filesystem exists
	if _, err := os.Stat(rootDrive); os.IsNotExist(err) {
		return nil, fmt.Errorf("root filesystem not found at %s", rootDrive)
	}

	bootSource := &firecracker.BootSource{
		KernelImagePath: kernelImage,
		BootArgs:        "keep_bootcon console=ttyS0 ro console=ttyS0 reboot=k panic=1 pci=off",
	}

	// Create root drive
	rootDriveConfig := firecracker.Drive{
		DriveID:      "rootfs",
		PathOnHost:   rootDrive,
		IsRootDevice: true,
		IsReadOnly:   false,
	}

	// Create a simple network interface
	networkInterface := firecracker.NetworkInterface{
		IfaceID: "eth0",
		GuestMAC: "06:00:AC:10:00:01",
		HostDevName: "tap0",
	}

	// Machine configuration with 1 vCPU and 512MB RAM
	machineConfig := firecracker.NewMachineConfiguration(1)
	machineConfig.MemorySizeMiB = 512

	return &VMConfig{
		KernelImagePath: kernelImage,
		RootDrivePath:   rootDrive,
		CPUCount:        1,
		MemSizeMB:       512,
		BootSource:      bootSource,
		Drives:          []firecracker.Drive{rootDriveConfig},
		NetworkInterfaces: []firecracker.NetworkInterface{networkInterface},
		MachineConfig:   machineConfig,
	}, nil
}

// NewAppVMConfig creates a VM configuration optimized for running applications
func NewAppVMConfig(vmID string, appID string, appImagePath string) (*VMConfig, error) {
	config, err := NewDefaultVMConfig(vmID)
	if err != nil {
		return nil, err
	}

	// Modify for app-specific configuration
	config.CPUCount = 2
	config.MemSizeMB = 1024

	// Update boot args for app-specific configuration
	config.BootSource.BootArgs = "keep_bootcon console=ttyS0 ro console=ttyS0 " +
		"systemd.unit=app-target.service +ppdev=off"

	// Add the application storage as a secondary drive
	appDrive := firecracker.Drive{
		DriveID:      "appdata",
		PathOnHost:   appImagePath,
		IsRootDevice: false,
		IsReadOnly:   false,
	}
	config.Drives = append(config.Drives, appDrive)

	return config, nil
}