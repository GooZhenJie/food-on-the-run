package handlers

import (
	"net/http"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

var dashboardKPI = []map[string]any{
	{"label": "Today's Orders", "value": 219, "trend": "+18% vs yesterday", "direction": "up"},
	{"label": "Today's Revenue", "value": 2498, "unit": "RM", "trend": "+23% vs yesterday", "direction": "up"},
	{"label": "Avg Order Value", "value": 11.4, "unit": "RM", "trend": "+RM 0.8", "direction": "up"},
	{"label": "Customer Rating", "value": 4.7, "unit": "/ 5", "trend": "+0.1", "direction": "up", "note": "last 7 days"},
}

var dashboardOpsKPI = []map[string]any{
	{"label": "Acceptance Rate", "value": 97, "unit": "%", "trend": "+1%", "direction": "up"},
	{"label": "Avg Prep Time", "value": 14, "unit": "min", "trend": "-2min", "direction": "down", "invertColor": true},
	{"label": "Cancellation Rate", "value": 2.3, "unit": "%", "trend": "-0.4%", "direction": "down", "invertColor": true},
	{"label": "Store Online", "value": 99, "unit": "%", "trend": "+0.2%", "direction": "up", "note": "vs last week"},
}

var dashboardSalesTrend = []map[string]any{
	{"date": "04/07", "orders": 128, "revenue": 1456},
	{"date": "04/08", "orders": 152, "revenue": 1734},
	{"date": "04/09", "orders": 98, "revenue": 1122},
	{"date": "04/10", "orders": 174, "revenue": 1988},
	{"date": "04/11", "orders": 201, "revenue": 2290},
	{"date": "04/12", "orders": 186, "revenue": 2124},
	{"date": "04/13", "orders": 219, "revenue": 2498},
}

var dashboardCategoryRadar = []map[string]any{
	{"name": "Nasi Lemak", "value": 88},
	{"name": "Drinks", "value": 62},
	{"name": "Kuih", "value": 45},
	{"name": "Fried Items", "value": 71},
	{"name": "Rice Sets", "value": 55},
	{"name": "Specials", "value": 39},
}

var dashboardWordcloud = []map[string]any{
	{"name": "Nasi Lemak", "value": 320},
	{"name": "Teh Tarik", "value": 210},
	{"name": "Sambal", "value": 185},
	{"name": "Ayam Goreng", "value": 160},
	{"name": "Roti Canai", "value": 155},
	{"name": "Milo Ais", "value": 142},
	{"name": "Kuih", "value": 130},
	{"name": "Ikan Bilis", "value": 118},
	{"name": "Sotong", "value": 105},
	{"name": "Nasi Goreng", "value": 98},
}

var dashboardGeo = []map[string]any{
	{"name": "Aunty Lily's", "coords": []float64{101.7058, 3.1467}, "orders": 219},
	{"name": "Wonton Noodle", "coords": []float64{101.6974, 3.1647}, "orders": 152},
	{"name": "Tandoor Palace", "coords": []float64{101.6861, 3.1319}, "orders": 98},
}

func (h *DashboardHandler) KPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardKPI)
}

func (h *DashboardHandler) OpsKPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardOpsKPI)
}

func (h *DashboardHandler) SalesTrend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardSalesTrend)
}

func (h *DashboardHandler) CategoryRadar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardCategoryRadar)
}

func (h *DashboardHandler) Wordcloud(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardWordcloud)
}

func (h *DashboardHandler) Geo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardGeo)
}

func (h *DashboardHandler) DPS(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	respondJSON(w, http.StatusOK, dashboardKPI)
}
