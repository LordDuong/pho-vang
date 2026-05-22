package websocket

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	gws "github.com/gorilla/websocket"
)

type Handler struct {
	hub      *Hub
	upgrader gws.Upgrader
}

func NewHandler(hub *Hub) *Handler {
	return &Handler{
		hub: hub,
		upgrader: gws.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (h *Handler) ServeWS(c *gin.Context) {
	if h == nil || h.hub == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "websocket hub is not ready",
		})
		return
	}

	role := strings.TrimSpace(c.Query("role"))
	if !IsAllowedRole(role) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid role",
		})
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "không thể kết nối websocket",
		})
		return
	}

	client := &Client{
		Conn: conn,
		Role: role,
		Hub:  h.hub,
	}

	h.hub.Register(client)
	go client.readPump()
}

func (c *Client) readPump() {
	if c == nil || c.Conn == nil {
		return
	}

	defer func() {
		if c.Hub != nil {
			c.Hub.Unregister(c)
		}
		if c.Conn != nil {
			_ = c.Conn.Close()
		}
	}()

	for {
		if _, _, err := c.Conn.ReadMessage(); err != nil {
			return
		}
	}
}
