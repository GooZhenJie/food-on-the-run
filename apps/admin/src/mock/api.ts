export default {
  'GET /api/admin/restaurants': (_req: unknown, res: { json: (data: unknown) => void }) => {
    res.json({ items: [], total: 0 });
  },
};
