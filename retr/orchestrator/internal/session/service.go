package session

import (
	"context"
	"fmt"
	"time"

	"github.com/mateszko090214/WebOS/orchestrator/internal/vm"
	"github.com/sirupsen/logrus"
)

// Service provides session management functionality with VM isolation
type Service struct {
	vmService *vm.VMService
	logger    *logrus.Entry
}

// NewService creates a new session service with VM isolation
func NewService(logger *logrus.Logger) *Service {
	return &Service{
		vmService: vm.NewVMService(logger),
		logger:    logger.WithField("component", "session_service"),
	}
}

// CreateSession creates a new user session with an isolated microVM
func (s *Service) CreateSession(ctx context.Context, userID string) (string, error) {
	// Generate a unique session ID
	sessionID := fmt.Sprintf("session-%s-%d", userID, time.Now().UnixNano())

	s.logger.WithFields(logrus.Fields{
		"user_id": userID,
		"session_id": sessionID,
	}).Info("Creating new session")

	// Create VM configuration for this session
	vmConfig, err := vm.NewDefaultVMConfig(sessionID)
	if err != nil {
		return "", fmt.Errorf("failed to create VM config: %w", err)
	}

	// Create the microVM for this session
	if _, err := s.vmService.CreateVM(ctx, sessionID, *vmConfig); err != nil {
		return "", fmt.Errorf("failed to create VM for session: %w", err)
	}

	// Start the VM
	if err := s.vmService.StartVM(ctx, sessionID); err != nil {
		return "", fmt.Errorf("failed to start VM for session: %w", err)
	}

	s.logger.WithFields(logrus.Fields{
		"session_id": sessionID,
		"vm_state":   s.vmService.GetVM(sessionID).GetState(),
	}).Info("Session VM started successfully")

	return sessionID, nil
}

// CheckpointSession checkpoints a running session's microVM
func (s *Service) CheckpointSession(sessionID string) error {
	// TODO: implement checkpoint using Firecracker's snapshot functionality
	s.logger.Info("Checkpoint session not yet implemented")
	return nil
}

// RestoreSession restores a session from checkpoint
func (s *Service) RestoreSession(sessionID string) error {
	// TODO: implement restore using Firecracker's snapshot functionality
	s.logger.Info("Restore session not yet implemented")
	return nil
}

// TerminateSession terminates a session and cleans up its resources
func (s *Service) TerminateSession(ctx context.Context, sessionID string) error {
	s.logger.WithField("session_id", sessionID).Info("Terminating session")

	// Stop the VM
	if err := s.vmService.StopVM(ctx, sessionID); err != nil {
		return fmt.Errorf("failed to stop VM: %w", err)
	}

	// Delete the VM and clean up resources
	if err := s.vmService.DeleteVM(ctx, sessionID); err != nil {
		return fmt.Errorf("failed to delete VM: %w", err)
	}

	s.logger.WithField("session_id", sessionID).Info("Session terminated successfully")
	return nil
}

// GetSessionInfo returns information about a session
func (s *Service) GetSessionInfo(sessionID string) (map[string]interface{}, error) {
	vm, err := s.vmService.GetVM(sessionID)
	if err != nil {
		return nil, err
	}

	info := map[string]interface{}{
		"session_id": sessionID,
		"vm_state":   vm.GetState(),
	}

	// Add VM metrics if running
	if vm.GetState() == vm.StateRunning {
		if metrics, err := vm.GetVMMetrics(); err == nil {
			info["metrics"] = metrics
		}
	}

	return info, nil
}