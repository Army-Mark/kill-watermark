package parser

import (
	"errors"
)

type ParserManager struct {
	parsers []Parser
}

func NewParserManager() *ParserManager {
	pm := &ParserManager{}
	pm.parsers = append(pm.parsers, &BilibiliParser{})
	pm.parsers = append(pm.parsers, &DouyinParser{})
	pm.parsers = append(pm.parsers, &XiaohongshuParser{})
	return pm
}

func (pm *ParserManager) Parse(rawURL string) (*VideoInfo, error) {
	for _, p := range pm.parsers {
		if p.CanParse(rawURL) {
			return p.Parse(rawURL)
		}
	}
	return nil, errors.New("不支持的平台或URL格式")
}
