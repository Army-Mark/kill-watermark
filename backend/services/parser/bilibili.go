package parser

import (
	"regexp"
)

type BilibiliParser struct{}

var bilibiliRegex = regexp.MustCompile(`(bilibili\.com|b23\.tv)`)

func (p *BilibiliParser) CanParse(url string) bool {
	return bilibiliRegex.MatchString(url)
}

func (p *BilibiliParser) Parse(rawURL string) (*VideoInfo, error) {
	return &VideoInfo{
		ID:        "bili-12345",
		Platform:  "bilibili",
		Title:     "测试视频 (解析功能演示)",
		CoverURL:  "https://picsum.photos/640/360",
		VideoURL:  "https://www.w3schools.com/html/mov_bbb.mp4",
		Author:    "演示作者",
		Duration:  60,
	}, nil
}
