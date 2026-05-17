package parser

import (
	"regexp"
)

type XiaohongshuParser struct{}

var xhsRegex = regexp.MustCompile(`(xiaohongshu\.com|xhslink\.com)`)

func (p *XiaohongshuParser) CanParse(url string) bool {
	return xhsRegex.MatchString(url)
}

func (p *XiaohongshuParser) Parse(rawURL string) (*VideoInfo, error) {
	return &VideoInfo{
		ID:        "xhs-12345",
		Platform:  "xiaohongshu",
		Title:     "小红书视频 (解析功能演示)",
		CoverURL:  "https://picsum.photos/640/360?random=2",
		VideoURL:  "https://www.w3schools.com/html/mov_bbb.mp4",
		Author:    "小红书作者",
		Duration:  45,
	}, nil
}
