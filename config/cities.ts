export interface IndianCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
  isPopular?: boolean;
}

export const INDIAN_CITIES: IndianCity[] = [
  // Top Metro & Major Cultural Hubs (Popular)
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867, isPopular: true },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, isPopular: true },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, isPopular: true },
  { name: "Delhi NCR", state: "Delhi", lat: 28.6139, lng: 77.2090, isPopular: true },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480, isPopular: true },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, isPopular: true },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, isPopular: true },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, isPopular: true },
  { name: "Goa", state: "Goa", lat: 15.2993, lng: 74.1240, isPopular: true },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, isPopular: true },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, isPopular: true },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, isPopular: true },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673, isPopular: true },
  { name: "Chandigarh", state: "Punjab / Haryana", lat: 30.7333, lng: 76.7794, isPopular: true },

  // Tier 2 & Regional Entertainment Hubs
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362 },
  { name: "Mysore", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { name: "Mangalore", state: "Karnataka", lat: 12.9141, lng: 74.8560 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { name: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lng: 79.4192 },
  { name: "Rajahmundry", state: "Andhra Pradesh", lat: 17.0005, lng: 81.8040 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { name: "Kozhikode", state: "Kerala", lat: 11.2588, lng: 75.7804 },
  { name: "Puducherry", state: "Puducherry", lat: 11.9416, lng: 79.8083 },
  { name: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Amritsar", state: "Punjab", lat: 31.6340, lng: 74.8723 },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 }
];

export const POPULAR_CITIES = INDIAN_CITIES.filter((c) => c.isPopular);
