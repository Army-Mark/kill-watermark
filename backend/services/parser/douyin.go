package parser

import (
	"regexp"
)

type DouyinParser struct{}

var douyinRegex = regexp.MustCompile(`(douyin\.com|iesdouyin\.com)`)

func (p *DouyinParser) CanParse(url string) bool {
	return douyinRegex.MatchString(url)
}

func (p *DouyinParser) Parse(rawURL string) (*VideoInfo, error) {
	return &VideoInfo{
		ID:        "douyin-12345",
		Platform:  "douyin",
		Title:     "抖音视频 (解析功能演示)",
		CoverURL:  "https://picsum.photos/640/360?random=1",
		VideoURL:  "https://www.w3schools.com/html/mov_bbb.mp4",
		Author:    "抖音作者",
		Duration:  30,
	}, nil
}
