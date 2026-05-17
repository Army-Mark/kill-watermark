package models

import (
	"time"
)

type History struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index;not null" json:"userId"`
	Platform    string    `gorm:"not null;size:20" json:"platform"`
	OriginalURL string    `gorm:"not null" json:"originalUrl"`
	VideoTitle  string    `gorm:"size:255" json:"videoTitle"`
	VideoURL    string    `json:"videoUrl"`
	CoverURL    string    `json:"coverUrl"`
	CreatedAt   time.Time `json:"createdAt"`
}
