import type { ToletListing, ToletFilters } from './tolet-types';

const MESS_LIKE: string[] = ['mess', 'hostel', 'seat'];
const FAMILY_LIKE: string[] = ['family', 'flat', 'bachelor', 'room'];

export function matchPropertyType(listingType: string, filterType: string): boolean {
  if (!filterType || filterType === 'all') return true;
  if (filterType === 'family') return FAMILY_LIKE.includes(listingType);
  if (filterType === 'seat') return MESS_LIKE.includes(listingType);
  return listingType === filterType;
}

export function filterToletListings(
  listings: ToletListing[],
  filters: ToletFilters,
  sortBy: string
): ToletListing[] {
  const searchTerm = (filters.search || '').trim().toLowerCase();

  const out = listings.filter((item) => {
    if (searchTerm) {
      const haystack = `${item.title} ${item.specificAddress}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }

    if (filters.areaId && item.areaId !== filters.areaId) return false;

    if (filters.propertyType && filters.propertyType !== 'all') {
      if (!matchPropertyType(item.propertyType, filters.propertyType)) return false;
    }

    if (typeof filters.minRent === 'number' && item.rentPrice < filters.minRent) return false;
    if (typeof filters.maxRent === 'number' && item.rentPrice > filters.maxRent) return false;

    if (filters.bedrooms && filters.bedrooms !== 'all') {
      const target = parseInt(filters.bedrooms, 10);
      if (target === 4) {
        if (item.bedrooms < 4) return false;
      } else if (item.bedrooms !== target) {
        return false;
      }
    }

    if (filters.bathrooms && filters.bathrooms !== 'all') {
      const target = parseInt(filters.bathrooms, 10);
      if (Number.isNaN(target)) return false;
      if (item.bathrooms < target) return false;
    }

    if (filters.facilities && filters.facilities.length > 0) {
      if (!filters.facilities.every((f) => item.facilities.includes(f))) return false;
    }

    if (filters.availability === 'now') {
      const avail = (item.availableFrom || '').toLowerCase();
      if (!avail.includes('তাৎক্ষণিক')) return false;
    }

    return true;
  });

  return out.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.rentPrice - b.rentPrice;
      case 'price_desc':
        return b.rentPrice - a.rentPrice;
      case 'availability': {
        const aNow = (a.availableFrom || '').includes('তাৎক্ষণিক') ? 1 : 0;
        const bNow = (b.availableFrom || '').includes('তাৎক্ষণিক') ? 1 : 0;
        if (aNow !== bNow) return bNow - aNow;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      case 'recent':
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      case 'newest':
      default:
        return (b.createdAt || '').localeCompare(a.createdAt || '');
    }
  });
}