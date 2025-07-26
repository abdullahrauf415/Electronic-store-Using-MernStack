// mutable flag others can import
let faqCacheDirty = true;

export function setFaqCacheDirty() {
  faqCacheDirty = true;
}

export function consumeFaqCacheDirty() {
  const wasDirty = faqCacheDirty;
  faqCacheDirty = false;
  return wasDirty;
}
