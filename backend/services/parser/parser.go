package parser

type VideoInfo struct {
	ID        string `json:"id"`
	Platform  string `json:"platform"`
	Title     string `json:"title"`
	CoverURL  string `json:"coverUrl"`
	VideoURL  string `json:"videoUrl"`
	Duration  int    `json:"duration,omitempty"`
	Author    string `json:"author,omitempty"`
}

type Parser interface {
	Parse(url string) (*VideoInfo, error)
	CanParse(url string) bool
}
