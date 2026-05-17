package handlers

type OrderHandler struct{ service interface{} }

func NewOrderHandler(service interface{}) *OrderHandler {
	return &OrderHandler{service: service}
}
