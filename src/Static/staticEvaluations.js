import data from "./road_sign_evaluations.json";

// تقييمات اللوحات الثابتة (من ملف JSON) تُستخدم بدل الذكاء الاصطناعي.
const byId = new Map(
  (data?.evaluations || []).map((e) => [Number(e.road_sign_id), e])
);

export const getStaticEvaluation = (roadSignId) => {
  const e = byId.get(Number(roadSignId));
  if (!e) return null;
  return {
    view_rate: e.view_rate ?? null,
    population_density_score: e.population_density_score ?? null,
    traffic_score: e.traffic_score ?? null,
    expected_audience_rate: e.expected_audience_rate ?? null,
    notes: e.notes ?? null,
    source: "ai",
    is_visible: true,
    last_error: null,
  };
};
