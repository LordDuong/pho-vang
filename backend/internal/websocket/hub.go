package websocket

import (
	"errors"
	"sync"
)

type Message struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type Client struct {
	Conn Conn
	Role string
	Hub  *Hub
	mu   sync.Mutex
}

type Hub struct {
	mu            sync.RWMutex
	clientsByRole map[string]map[*Client]struct{}
}

type Conn interface {
	Close() error
	ReadMessage() (messageType int, p []byte, err error)
	WriteJSON(v interface{}) error
}

func NewHub() *Hub {
	return &Hub{
		clientsByRole: make(map[string]map[*Client]struct{}),
	}
}

func (h *Hub) Register(client *Client) {
	if h == nil || client == nil {
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.clientsByRole[client.Role]; !exists {
		h.clientsByRole[client.Role] = make(map[*Client]struct{})
	}

	h.clientsByRole[client.Role][client] = struct{}{}
}

func (h *Hub) Unregister(client *Client) {
	if h == nil || client == nil {
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	clients, exists := h.clientsByRole[client.Role]
	if !exists {
		return
	}

	delete(clients, client)
	if len(clients) == 0 {
		delete(h.clientsByRole, client.Role)
	}
}

func (h *Hub) BroadcastToRoles(roles []string, message Message) {
	if h == nil {
		return
	}

	clients := h.clientsForRoles(roles)
	if len(clients) == 0 {
		return
	}

	seen := make(map[*Client]struct{}, len(clients))
	for _, client := range clients {
		if _, ok := seen[client]; ok {
			continue
		}
		seen[client] = struct{}{}

		if err := client.sendJSON(message); err != nil {
			h.Unregister(client)
		}
	}
}

func (h *Hub) BroadcastToAll(message Message) {
	if h == nil {
		return
	}

	h.mu.RLock()
	clients := make([]*Client, 0)
	for _, roleClients := range h.clientsByRole {
		for client := range roleClients {
			clients = append(clients, client)
		}
	}
	h.mu.RUnlock()

	for _, client := range clients {
		if err := client.sendJSON(message); err != nil {
			h.Unregister(client)
		}
	}
}

func (h *Hub) clientsForRoles(roles []string) []*Client {
	if h == nil {
		return nil
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	clients := make([]*Client, 0)
	for _, role := range roles {
		roleClients, exists := h.clientsByRole[role]
		if !exists {
			continue
		}

		for client := range roleClients {
			clients = append(clients, client)
		}
	}

	return clients
}

func (c *Client) sendJSON(message Message) error {
	if c == nil || c.Conn == nil {
		return errors.New("nil websocket connection")
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	return c.Conn.WriteJSON(message)
}

func IsAllowedRole(role string) bool {
	switch role {
	case "waiter", "kitchen", "cashier", "manager", "owner", "customer":
		return true
	default:
		return false
	}
}
