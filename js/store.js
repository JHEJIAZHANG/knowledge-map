// 数据层：检查内容，提供查找与日期工具
(function () {
  const KM = window.KnowledgeMap;

  const valid = KM.chapters.filter((c) => {
    const t = KM.topics.find((x) => x.id === c.topic);
    const ok = t && (t.groups || []).some((g) => g.id === c.group) && /^\d{4}-\d{2}-\d{2}$/.test(c.date || '');
    if (!ok) console.error('文章缺少有效的 topic、group 或 date，已略过：', c.id);
    return ok;
  });
  KM.chapters.length = 0;
  KM.chapters.push(...valid);
  const chapters = KM.chapters;

  // 日期一律用本地时间，不用 toISOString，否则会因时区差一天
  const parseDay = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const diffDays = (a, b) => Math.round((a - b) / 864e5);
  const today = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };

  const topicOf = (c) => KM.topics.find((t) => t.id === c.topic);
  const inTopic = (id) => chapters.filter((c) => c.topic === id);
  const groupOf = (c) => topicOf(c).groups.find((g) => g.id === c.group);
  // 只返回有文章的分类：[{ group, list }]
  const groupsOf = (t) => (t.groups || [])
    .map((group) => ({ group, list: inTopic(t.id).filter((c) => c.group === group.id) }))
    .filter((x) => x.list.length);
  const numberIn = (c) => inTopic(c.topic).indexOf(c) + 1;
  const pad = (n) => String(n).padStart(2, '0');

  // 新到旧；同一天内，后加入的排前面
  const byNewest = (list) => list
    .map((c) => [c, chapters.indexOf(c)])
    .sort((a, b) => b[0].date.localeCompare(a[0].date) || b[1] - a[1])
    .map(([c]) => c);

  const chapterUrl = (c, nav) => `#/c/${encodeURIComponent(c.id)}${nav ? `/${encodeURIComponent(nav)}` : ''}`;
  const topicUrl = (t) => `#/t/${encodeURIComponent(t.id)}`;

  const countsByDay = () => {
    const map = new Map();
    for (const c of chapters) map.set(c.date, (map.get(c.date) || 0) + 1);
    return map;
  };

  // 连续上传天数。今天还没上传时，从昨天起算，不算中断
  const streaks = () => {
    const days = countsByDay();
    const sorted = [...days.keys()].sort();
    let longest = 0;
    let run = 0;
    let prev = null;
    for (const k of sorted) {
      const d = parseDay(k);
      run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = d;
    }
    let cursor = today();
    if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
    let current = 0;
    while (days.has(dayKey(cursor))) { current++; cursor = addDays(cursor, -1); }
    return { current, longest };
  };

  KM.store = { parseDay, dayKey, addDays, diffDays, today, topicOf, inTopic, groupOf, groupsOf, numberIn, pad, byNewest, chapterUrl, topicUrl, countsByDay, streaks };
})();
