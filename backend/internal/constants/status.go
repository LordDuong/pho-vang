package constants

// Trạng thái đơn hàng
const (
	StatusPending    = "pending"
	StatusConfirmed  = "confirmed"
	StatusCooking    = "cooking"
	StatusReady      = "ready"
	StatusServing    = "serving"
	StatusWaitingPay = "waiting_pay"
	StatusPaid       = "paid"
)

// Phương thức thanh toán
const (
	PayMethodCash     = "Tiền mặt"
	PayMethodTransfer = "Chuyển khoản"
	PayMethodMomo     = "Momo"
	PayMethodVNPay    = "VNPay"
)

var StatusFlow = map[string]string{
	StatusPending:    StatusConfirmed,
	StatusConfirmed:  StatusCooking,
	StatusCooking:    StatusReady,
	StatusReady:      StatusServing,
	StatusServing:    StatusWaitingPay,
	StatusWaitingPay: StatusPaid,
	StatusPaid:       "",
}

func IsValidStatusTransition(currentStatus, newStatus string) bool {
	nextStatus, exists := StatusFlow[currentStatus]
	return exists && nextStatus == newStatus
}
