package services

import (
	"fmt"
	"time"

	"github.com/TOM88bet/PHO-VANG/backend/internal/models"
	"github.com/TOM88bet/PHO-VANG/backend/internal/repositories"
)

type ScheduleService struct {
	repo *repositories.ScheduleRepository
}

func NewScheduleService(repo *repositories.ScheduleRepository) *ScheduleService {
	return &ScheduleService{repo: repo}
}

type ShiftEntry struct {
	EmployeeID   uint   `json:"employee_id"`
	EmployeeName string `json:"employee_name"`
	Shift        string `json:"shift"`
}

type DaySchedule struct {
	Day     int          `json:"day"`
	DayName string       `json:"day_name"`
	Date    string       `json:"date"`
	Shifts  []ShiftEntry `json:"shifts"`
}

type WeekSchedule struct {
	Week string        `json:"week"`
	Days []DaySchedule `json:"days"`
}

var dayNames = []string{"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"}

func currentWeek() string {
	year, week := time.Now().ISOWeek()
	return fmt.Sprintf("%d-W%02d", year, week)
}

func weekStartDate(weekStr string) time.Time {
	var year, week int
	fmt.Sscanf(weekStr, "%d-W%d", &year, &week)
	// Find Monday of that week
	jan4 := time.Date(year, 1, 4, 0, 0, 0, 0, time.Local)
	_, jan4Week := jan4.ISOWeek()
	monday := jan4.AddDate(0, 0, (week-jan4Week)*7-int(jan4.Weekday())+1)
	return monday
}

func (s *ScheduleService) GetSchedule(weekStr string) (*WeekSchedule, error) {
	if weekStr == "" {
		weekStr = currentWeek()
	}

	schedules, err := s.repo.FindByWeek(weekStr)
	if err != nil {
		return nil, err
	}

	monday := weekStartDate(weekStr)
	dayMap := make(map[int][]ShiftEntry)

	for _, sc := range schedules {
		dayMap[sc.Day] = append(dayMap[sc.Day], ShiftEntry{
			EmployeeID:   sc.EmployeeID,
			EmployeeName: sc.Employee.Name,
			Shift:        sc.Shift,
		})
	}

	var days []DaySchedule
	for i := 0; i < 7; i++ {
		date := monday.AddDate(0, 0, i)
		days = append(days, DaySchedule{
			Day:     i,
			DayName: dayNames[i],
			Date:    date.Format("2006-01-02"),
			Shifts:  dayMap[i],
		})
	}

	return &WeekSchedule{Week: weekStr, Days: days}, nil
}

func (s *ScheduleService) UpdateSchedule(weekStr string, days []map[string]interface{}) error {
	// Delete existing schedule for this week
	err := s.repo.DeleteByWeek(weekStr)
	if err != nil {
		return err
	}

	var schedules []models.Schedule
	for _, day := range days {
		dayNum := int(day["day"].(float64))
		shifts := day["shifts"].([]interface{})
		for _, sh := range shifts {
			shift := sh.(map[string]interface{})
			schedules = append(schedules, models.Schedule{
				Week:       weekStr,
				Day:        dayNum,
				EmployeeID: uint(shift["employee_id"].(float64)),
				Shift:      shift["shift"].(string),
			})
		}
	}

	if len(schedules) == 0 {
		return nil
	}
	return s.repo.CreateBatch(schedules)
}
