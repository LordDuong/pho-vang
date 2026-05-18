package services

import "errors"

var (
	ErrOrderNotFound           = errors.New("order not found")
	ErrOrderAlreadyPaid        = errors.New("order already paid")
	ErrInvalidOrderStatus      = errors.New("invalid order status")
	ErrInvalidStatusTransition = errors.New("invalid status transition")
	ErrInvalidPaymentStatus    = errors.New("order status must be waiting_pay to process payment")
	ErrDuplicateSale           = errors.New("sale already exists for this order")
)
