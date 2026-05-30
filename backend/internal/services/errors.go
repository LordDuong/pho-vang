package services

import "errors"

var (
	ErrOrderNotFound           = errors.New("order not found")
	ErrOrderAlreadyPaid        = errors.New("order already paid")
	ErrInvalidOrderStatus      = errors.New("invalid order status")
	ErrInvalidStatusTransition = errors.New("invalid status transition")
	ErrDirectPaidUpdate        = errors.New("cannot update order to paid directly")
	ErrInvalidPaymentStatus    = errors.New("order status must be waiting_pay to process payment")
	ErrDuplicateSale           = errors.New("sale already exists for this order")
	ErrMenuItemNotFound        = errors.New("menu item not found")
	ErrInvalidMenuItemPrice    = errors.New("price must be greater than 0")
)
