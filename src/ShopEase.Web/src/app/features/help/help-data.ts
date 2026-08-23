export interface HelpTool {
  title: string;
  icon: string;
  color: string;
  link: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  icon: string;
  color: string;
  link: string;
  summary: string;
  keywords: string;
  steps: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export const TOOLS: HelpTool[] = [
  { title: 'Track My Orders', icon: 'truck', color: 'primary', link: '/orders' },
  { title: 'My Wishlist', icon: 'heart', color: 'danger', link: '/wishlist' },
  { title: 'View Cart', icon: 'cart3', color: 'success', link: '/cart' },
  { title: 'Profile & Addresses', icon: 'person-gear', color: 'info', link: '/profile' },
  { title: 'Browse Products', icon: 'grid', color: 'warning', link: '/catalog' },
  { title: 'My Reports', icon: 'bar-chart', color: 'secondary', link: '/reports' },
];

export const ARTICLES: HelpArticle[] = [
  { id: 'home', title: 'Getting Started', icon: 'house', color: 'primary', link: '/home',
    summary: 'Find your way around ShopEase.',
    keywords: 'start home navigate menu account',
    steps: [
      'The <b>Home</b> page shows featured products, new arrivals, shop-by-category and your recent orders.',
      'Use the top menu to reach <b>Catalog</b>, <b>My Orders</b> and <b>Reports</b>; the icons open Wishlist, Notifications and Cart.',
      'Your account menu (top-right) has My Profile and My Orders.',
    ] },
  { id: 'catalog', title: 'Browsing & Searching', icon: 'grid', color: 'warning', link: '/catalog',
    summary: 'Find products with filters, search and sorting.',
    keywords: 'browse search filter category price sort in stock quick view wishlist',
    steps: [
      'Use the <b>search box</b> and filters (category, price range, sort, in-stock) on the Catalog. <b>Clear Filter</b> resets them.',
      'Click the <b>eye</b> icon on a product for a <b>Quick View</b> without leaving the page.',
      'Click the <b>heart</b> icon to save an item to your Wishlist.',
      'Use the pagination at the bottom to move through results.',
    ] },
  { id: 'product-detail', title: 'Product Details & Reviews', icon: 'box-seam', color: 'primary', link: '/catalog',
    summary: 'View details, choose quantity, and read or write reviews.',
    keywords: 'product detail review rating stars add cart quantity related wishlist',
    steps: [
      'Open a product to see its description, price, stock and star rating.',
      'Set the <b>quantity</b> and click <b>Add to Cart</b>, or add it to your <b>Wishlist</b>.',
      "Scroll to <b>Ratings & Reviews</b> to read others' feedback or <b>write your own</b> (pick stars + a comment).",
      'Check <b>Related Products</b> for similar items.',
    ] },
  { id: 'wishlist', title: 'Your Wishlist', icon: 'heart', color: 'danger', link: '/wishlist',
    summary: 'Save products to buy later.',
    keywords: 'wishlist favourite heart save move to cart remove',
    steps: [
      'Tap the <b>heart</b> on any product (catalog, quick view or product page) to save it.',
      'Open <b>Wishlist</b> (heart icon in the menu) to see saved items.',
      'From there, <b>Add to Cart</b> or remove items.',
    ] },
  { id: 'cart', title: 'Cart, Coupons & Save for Later', icon: 'cart3', color: 'success', link: '/cart',
    summary: 'Manage items, apply coupons and save items for later.',
    keywords: 'cart quantity remove coupon promo code discount save for later',
    steps: [
      'Adjust quantities with the +/− controls, or remove an item.',
      'Use <b>Save for later</b> (bookmark icon) to move an item out of the cart; move it back anytime from the "Saved for Later" list.',
      'Enter a <b>coupon code</b> in the summary and click Apply (try SAVE10, WELCOME50, FLAT100, FREESHIP). Remove it anytime.',
      'Click <b>Proceed to Checkout</b> when ready.',
    ] },
  { id: 'checkout', title: 'Checkout & Payment', icon: 'bag-check', color: 'primary', link: '/cart',
    summary: 'Choose an address, pay and place your order.',
    keywords: 'checkout address payment method card upi cod place order',
    steps: [
      'Select a <b>delivery address</b> (add one in your Profile if you have none).',
      'Choose a <b>payment method</b>; enter card or UPI details if required (Cash on Delivery needs none).',
      'Review the order summary (including any coupon discount) and click <b>Place Order</b>.',
      "You'll get an order confirmation with your order number.",
    ] },
  { id: 'orders', title: 'Orders & Tracking', icon: 'truck', color: 'info', link: '/orders',
    summary: 'Track orders, download invoices and reorder.',
    keywords: 'order track timeline status invoice pdf reorder filter',
    steps: [
      'Open <b>My Orders</b> and filter by status, date or amount.',
      'Click <b>Details</b> to see the order timeline (Pending → Processing → Shipped → Delivered), items and payment.',
      'Click <b>Invoice</b> to download a PDF invoice.',
      'Use <b>Reorder</b> on a past order to add all its items back to your cart.',
    ] },
  { id: 'returns', title: 'Cancellations & Returns', icon: 'arrow-return-left', color: 'warning', link: '/orders',
    summary: 'Cancel a pending order or return a delivered one.',
    keywords: 'cancel return refund terms conditions delivered pending',
    steps: [
      '<b>Cancel</b>: available while an order is still <b>Pending</b>. Click Cancel, read & agree to the cancellation terms, then proceed.',
      '<b>Return</b>: available for <b>Delivered</b> orders within the return window. Click Return, agree to the return terms, then proceed.',
      'Both actions require accepting the Terms & Conditions before they go through.',
      'Refunds are processed to your original payment method (returns are refunded after inspection).',
    ] },
  { id: 'reports', title: 'My Reports', icon: 'bar-chart', color: 'secondary', link: '/reports',
    summary: 'Generate and export your orders, payments and cart reports.',
    keywords: 'report orders payments cart export csv print',
    steps: [
      'Open <b>Reports</b> and pick a report (My Orders, Payment History or Cart Summary).',
      'Apply filters and generate the report.',
      'Export it as CSV/Text or print it for your records.',
    ] },
  { id: 'profile', title: 'Profile & Addresses', icon: 'person-gear', color: 'info', link: '/profile',
    summary: 'Update your details and delivery addresses.',
    keywords: 'profile name phone address add edit delivery',
    steps: [
      'Open <b>My Profile</b> from the account menu.',
      'Edit your name and phone (email cannot be changed) and Save.',
      'Add or edit <b>delivery addresses</b> — these appear at checkout.',
    ] },
  { id: 'notifications', title: 'Notifications', icon: 'bell', color: 'primary', link: '/notifications',
    summary: 'Stay updated on orders and offers.',
    keywords: 'notification alert read unread order update',
    steps: [
      'Click the <b>bell</b> icon to view notifications about your orders and payments.',
      'Unread items are highlighted; open or mark them as read.',
    ] },
];

export const FAQS: Faq[] = [
  { q: 'How do I track my order?', a: 'Open <b>My Orders</b>, click <b>Details</b> on an order, and view its status timeline (Pending → Processing → Shipped → Delivered).' },
  { q: 'How do I cancel or return an order?', a: 'Cancel is available for <b>Pending</b> orders and Return for <b>Delivered</b> orders. Click the button on the order, accept the Terms & Conditions, then proceed.' },
  { q: 'What payment methods can I use?', a: 'At checkout you can choose from the available methods (e.g. Credit/Debit Card, UPI, Cash on Delivery). The list may be updated by the store.' },
  { q: 'How do I apply a coupon?', a: 'In your <b>Cart</b>, enter a coupon code in the order summary and click Apply. Try codes like SAVE10, WELCOME50, FLAT100 or FREESHIP. The discount shows in the summary.' },
  { q: 'How do I save an item to buy later?', a: 'In the cart, click the <b>Save for later</b> (bookmark) icon. The item moves to "Saved for Later", and you can move it back to the cart anytime.' },
  { q: 'How do I write a product review?', a: 'Open the product page, scroll to <b>Ratings & Reviews</b>, choose a star rating, add a comment and submit. One review per product.' },
  { q: 'How do I download an invoice?', a: 'In <b>My Orders</b>, click <b>Invoice</b> on the order to download a PDF copy.' },
  { q: 'How do I add a delivery address?', a: 'Go to <b>My Profile</b> → Delivery Addresses → Add. Saved addresses appear at checkout.' },
  { q: 'How do I reorder something I bought before?', a: 'In <b>My Orders</b>, click <b>Reorder</b> on a past order to add all its items back to your cart.' },
  { q: "When will an out-of-stock item be available?", a: "Out-of-stock items can't be added to the cart. Add them to your Wishlist and check back, or contact support for availability." },
];
