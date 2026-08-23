export interface AdminGuide {
  id: string;
  module: string;
  icon: string;
  color: string;
  page: string;
  summary: string;
  keywords: string;
  steps: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export const GUIDES: AdminGuide[] = [
  { id: 'dashboard', module: 'Dashboard', icon: 'speedometer2', color: 'primary', page: '/admin/dashboard',
    summary: 'Read KPIs, charts and recent activity at a glance.',
    keywords: 'kpi revenue chart analytics date range filter activity',
    steps: [
      'Open <b>Dashboard</b> to see KPI cards: revenue, orders, customers and products.',
      "Use the <b>date range</b> in the page header and click <b>Apply</b> to scope the figures; <b>Reset</b> returns to all-time.",
      'Charts are collapsed by default — click the <b>Analytics</b> header to expand them, then pick chart types/grouping.',
      'The activity feed lists recent system events (logins, orders, status changes).',
    ] },
  { id: 'products', module: 'Products', icon: 'box-seam', color: 'success', page: '/admin/products',
    summary: 'Add single or bulk products, edit, view and manage stock.',
    keywords: 'add product single bulk upload csv template sku stock price edit delete view custom field',
    steps: [
      'Click <b>Add Product</b> and fill the mandatory fields marked with *.',
      'In <b>Edit</b> mode, green fields are editable and the gray <b>SKU</b> is a fixed identifier (read-only).',
      'Use the row actions: <b>View</b>, <b>Edit</b>, <b>Delete</b>. Edit & delete ask for confirmation.',
      'For many items, click <b>Bulk Upload</b> → <b>Download CSV Template</b>, fill it, upload, review the validation preview, then import.',
      'Extra fields defined in <b>Dynamic → Custom Fields</b> (target: Products) appear under "Additional Details" in the form.',
    ] },
  { id: 'categories', module: 'Categories', icon: 'tags', color: 'info', page: '/admin/categories',
    summary: 'Create and organise product categories.',
    keywords: 'category add edit delete view product count',
    steps: [
      'Click <b>Add Category</b> and enter a name (description optional).',
      'Each card has <b>View</b>, <b>Edit</b> and <b>Delete</b> actions; the Category ID is shown read-only when editing.',
      'A category that still has products assigned cannot be deleted — reassign or remove those products first.',
    ] },
  { id: 'orders', module: 'Orders', icon: 'bag-check', color: 'warning', page: '/admin/orders',
    summary: 'Track orders, update status and capture extra details.',
    keywords: 'order status timeline update cancel processing shipped delivered custom field additional details',
    steps: [
      'Use the filters (status, dates, amount) then <b>Filter</b>; status options come from <b>Dynamic → Statuses</b>.',
      'Click <b>View</b> on a row to see the order timeline, items, address and payment.',
      'In the detail dialog, use the status buttons (e.g. <b>Mark as Shipped</b>) — each asks for confirmation and notifies the customer.',
      'Fill any "Additional Details" custom fields and click <b>Save Additional Details</b>.',
    ] },
  { id: 'customers', module: 'Users', icon: 'people', color: 'primary', page: '/admin/customers',
    summary: 'View customer accounts and toggle their status.',
    keywords: 'user customer view activate deactivate status account',
    steps: [
      'Search/filter users, then click <b>View</b> to see full details and saved addresses.',
      'Use the <b>Activate/Deactivate</b> toggle to enable or suspend an account (asks for confirmation).',
    ] },
  { id: 'reports', module: 'Reports', icon: 'file-earmark-bar-graph', color: 'danger', page: '/admin/reports',
    summary: 'Generate, filter and export reports.',
    keywords: 'report centre export csv text print filters run',
    steps: [
      'On the <b>Report Centre</b>, browse a category or search, then click a report to open it.',
      'Set the filters and click <b>Run Report</b>.',
      'Use <b>CSV</b>, <b>Text</b> or <b>Print</b> to export the results.',
    ] },
  { id: 'backup', module: 'Backup & Recovery', icon: 'hdd-stack', color: 'secondary', page: '/admin/backup',
    summary: 'Schedule backup jobs, restore data and reset.',
    keywords: 'backup recovery job schedule restore wizard staging export import reset retention full incremental',
    steps: [
      'The dashboard shows Last Backup, Active Jobs, Success Rate and total backups.',
      'Click <b>New Job</b> to define a backup: name, source data, destination, type, schedule and retention — then confirm.',
      'Use <b>Run Now</b>, pause/resume or delete jobs from the Scheduled Jobs table.',
      'Click <b>Restore</b> for the 4-step wizard: Identify the backup → Verify integrity → Choose scope & target (Staging is a safe dry-run) → Execute.',
      'Quick Export downloads a JSON snapshot; the Danger Zone <b>Reset</b> wipes and re-seeds all data.',
    ] },
  { id: 'dynamic', module: 'Dynamic Handling', icon: 'ui-checks-grid', color: 'primary', page: '/admin/dynamic',
    summary: 'Add custom fields and manage statuses/lookups without code.',
    keywords: 'dynamic custom field status payment method lookup add delete colour',
    steps: [
      '<b>Custom Fields</b> tab: click <b>New Field</b>, set a label, target entity, type and whether it is required.',
      'Fields targeting Orders/Products appear automatically in those add/edit/view screens.',
      '<b>Statuses & Lookups</b> tab: add or delete Order Statuses, Payment Statuses and Payment Methods — pick a colour for new statuses.',
      'New values flow through automatically; a value in use cannot be deleted.',
    ] },
  { id: 'cms', module: 'Home Page Content', icon: 'layout-text-window-reverse', color: 'info', page: '/admin/cms',
    summary: 'Edit the customer Home page with a live preview.',
    keywords: 'cms content home page hero banner section preview publish edit website',
    steps: [
      'Pick an area from the left submenu (Hero Banner or a Section).',
      'Edit it in the middle panel and watch the <b>live preview</b> on the right update instantly.',
      'Add, reorder (↑/↓), hide or delete sections; product sections let you choose the source (featured/newest/category/hand-picked).',
      'Click <b>Publish</b> to push changes live — open customer Home pages update automatically.',
    ] },
];

export const FAQS: Faq[] = [
  { q: 'How do I add many products at once?', a: 'Go to <b>Products → Bulk Upload</b>, download the CSV template, fill it in, upload it, review the validation preview, and import.' },
  { q: "Why can't I edit the SKU when editing a product?", a: 'The SKU is a fixed identifier, so it is shown read-only (gray) in Edit mode. Create a new product if you need a different SKU.' },
  { q: 'How do I add a new order/payment status like "Failure"?', a: 'Open <b>Dynamic → Statuses & Lookups</b>, type the name in the relevant list, pick a colour, and click Add.' },
  { q: 'I added a payment method — will customers see it?', a: 'Yes. Methods added in <b>Dynamic → Payment Methods</b> appear automatically on the customer checkout page.' },
  { q: 'How do I change the customer Home page?', a: 'Use <b>Content (CMS)</b>. Edit the hero/sections, preview live, then click Publish. No code changes are needed.' },
  { q: 'How do I restore data safely without overwriting live data?', a: 'In <b>Backup → Restore</b>, at the "Scope & Target" step choose <b>Staging</b> — it validates and stages the data as a dry-run without touching live data.' },
  { q: 'How do I reset everything to the seeded sample data?', a: 'Go to <b>Backup → Danger Zone → Reset to Defaults</b>. This wipes all data and re-seeds the samples — it cannot be undone.' },
  { q: 'Where do custom fields show up?', a: 'Fields you define in <b>Dynamic → Custom Fields</b> render in the add/edit/view screens of the target entity.' },
];
