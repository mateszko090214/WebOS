package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"

	"github.com/mateszko090214/WebOS/orchestrator/internal/ai"
	"github.com/mateszko090214/WebOS/orchestrator/internal/session"
)

// main entry point for the orchestrator service
func main() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})
	logger.Info("Starting HyperWebOS Orchestrator...")

	// Initialize services
	aiConfig := &ai.Config{
		APIEndpoint:     os.Getenv("AI_API_ENDPOINT"),
		APIKey:          os.Getenv("AI_API_KEY"),
		DefaultModel:    os.Getenv("AI_DEFAULT_MODEL"),
		TimeoutSeconds:  30,
	}
	aiService := ai.NewService(logger, aiConfig)
	sessionService := session.NewService(logger)

	r := mux.NewRouter()
	r.HandleFunc("/health", healthHandler).Methods("GET")
	r.HandleFunc("/session/start", func(w http.ResponseWriter, r *http.Request) {
		startSessionHandler(w, r, sessionService)
	}).Methods("POST")
	r.HandleFunc("/ws/{session_id}", wsHandler).Methods("GET")
	r.HandleFunc("/ai/chat", func(w http.ResponseWriter, r *http.Request) {
		aiChatHandler(w, r, aiService)
	}).Methods("POST")

	srv := &http.Server{
		Handler: r,
		Addr:    ":8080",
		// Good practice: set timeouts to avoid Slowloris attacks.
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("ListenAndServe(): %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	logger.Info("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown:", err)
	}

	logger.Info("Server exited")
}

// healthHandler returns a simple health check
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

// startSessionHandler is a placeholder for session creation
func startSessionHandler(w http.ResponseWriter, r *http.Request, sessionService *session.Service) {
	// TODO: Implement actual session creation with user authentication
	userID := "anonymous" // In a real app, this would come from auth
	sessionID, err := sessionService.CreateSession(r.Context(), userID)
	if err != nil {
		logger := logrus.WithFields(logrus.Fields{
			"component": "http_handler",
			"function":  "startSessionHandler",
		})
		logger.WithError(err).Error("Failed to create session")
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{
		"session_id": sessionID,
		"ws_url":     "ws://localhost:8080/ws/" + sessionID,
	}
	json.NewEncoder(w).Encode(response)
}

// wsHandler upgrades connection to WebSocket and delegates to internal ws.Handler
func wsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["session_id"]
	// Attach session ID to context for the WS handler
	ctx := context.WithValue(r.Context(), "session_id", sessionID)
	r = r.WithContext(ctx)
	// Delegate to WS package handler
	ws.Handler(w, r)
}

// aiChatHandler handles AI chat completion requests
func aiChatHandler(w http.ResponseWriter, r *http.Request, aiService *ai.Service) {
	var req ai.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set default model if not specified
	if req.Model == "" {
		req.Model = "default"
	}

	response, err := aiService.ChatCompletion(r.Context(), req)
	if err != nil {
		logger := logrus.WithFields(logrus.Fields{
			"component": "http_handler",
			"function":  "aiChatHandler",
		})
		logger.WithError(err).Error("Failed to generate AI chat completion")
		http.Error(w, "Failed to generate AI response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}