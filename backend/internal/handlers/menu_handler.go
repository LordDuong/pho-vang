package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/TOM88bet/PHO-VANG/backend/internal/dto"
	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/services"
	ws "github.com/TOM88bet/PHO-VANG/backend/internal/websocket"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MenuHandler struct {
	menuService *services.MenuService
	wsHub       *ws.Hub
}

func NewMenuHandler(menuService *services.MenuService) *MenuHandler {
	return &MenuHandler{
		menuService: menuService,
	}
}

func (h *MenuHandler) SetWebSocketHub(wsHub *ws.Hub) {
	h.wsHub = wsHub
}

func (h *MenuHandler) GetMenuItems(c *gin.Context) {
	items, err := h.menuService.GetMenuItems()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to fetch menu items",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
		"message": "Menu items retrieved successfully",
	})
}

func (h *MenuHandler) GetAllMenuItems(c *gin.Context) {
	items, err := h.menuService.GetAllMenuItems()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to fetch menu items",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
		"message": "Menu items retrieved successfully",
	})
}

func (h *MenuHandler) CreateMenuItem(c *gin.Context) {
	var request dto.CreateMenuItemRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid request body",
		})
		return
	}

	if request.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "name is required",
		})
		return
	}

	if request.Cat == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "cat is required",
		})
		return
	}

	if request.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "price must be greater than 0",
		})
		return
	}

	menuItem := models.MenuItem{
		Name:  request.Name,
		Cat:   request.Cat,
		Price: request.Price,
		Desc:  request.Desc,
		Img:   request.Img,
		Emoji: request.Emoji,
		Avail: request.Avail,
	}

	err := h.menuService.CreateMenuItem(&menuItem)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to create menu item",
		})
		return
	}

	h.broadcastMenuToRoles("create", &menuItem)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    menuItem,
		"message": "Menu item created successfully",
	})
}

func (h *MenuHandler) UpdateMenuItem(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid menu item id",
		})
		return
	}

	var request dto.UpdateMenuItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid request body",
		})
		return
	}

	// Chỉ cập nhật field được gửi lên
	updateData := make(map[string]interface{})

	if request.Name != "" {
		updateData["name"] = request.Name
	}
	if request.Cat != "" {
		updateData["cat"] = request.Cat
	}
	if request.Price > 0 {
		updateData["price"] = request.Price
	}
	if request.Desc != "" {
		updateData["desc"] = request.Desc
	}
	if request.Img != "" {
		updateData["img"] = request.Img
	}
	if request.Emoji != "" {
		updateData["emoji"] = request.Emoji
	}
	if request.Avail != nil {
		updateData["avail"] = *request.Avail
	}

	if len(updateData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "no fields to update",
		})
		return
	}

	err = h.menuService.UpdateMenuItem(uint(id), updateData)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to update menu item",
		})
		return
	}

	updatedItem, err := h.menuService.GetMenuItemByID(uint(id))
	if err == nil {
		h.broadcastMenuToRoles("update", updatedItem)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Menu item updated successfully",
	})
}

func (h *MenuHandler) DeleteMenuItem(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid menu item id",
		})
		return
	}

	err = h.menuService.DeleteMenuItem(uint(id))

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "menu item not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "failed to delete menu item",
		})
		return
	}

	if deletedItem, err := h.menuService.GetMenuItemByID(uint(id)); err == nil {
		deletedItem.Avail = false
		h.broadcastMenuToRoles("delete", deletedItem)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Menu item deleted successfully",
	})
}

func (h *MenuHandler) broadcastMenuToRoles(action string, item *models.MenuItem) {
	if h.wsHub == nil || item == nil {
		return
	}

	h.wsHub.BroadcastToRoles([]string{"customer", "manager", "owner"}, ws.Message{
		Event: "menu_updated",
		Data: gin.H{
			"action": action,
			"item":   item,
		},
	})
}
