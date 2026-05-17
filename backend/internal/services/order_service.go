package services

type OrderService struct{ repo interface{} }

func NewOrderService(repo interface{}) *OrderService {
	return &OrderService{repo: repo}
}
