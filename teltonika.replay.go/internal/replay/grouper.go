package replay

import "sort"

// SortByHappenedAt sorts each device's packet slice ascending by HappenedAt so
// per-device replay (and the downstream LastTsMap dedup) sees strictly
// increasing timestamps (§5.1 step 3). Rows in a file are ascending already,
// but the service must not rely on global ordering (§3.2).
func SortByHappenedAt(byDevice map[string][]ReplayPacket) {
	for _, packets := range byDevice {
		sort.SliceStable(packets, func(i, j int) bool {
			return packets[i].HappenedAt.Before(packets[j].HappenedAt)
		})
	}
}
