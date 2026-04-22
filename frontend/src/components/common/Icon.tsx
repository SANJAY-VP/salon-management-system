import {
  FaHome,
  FaCalendar,
  FaGift,
  FaUser,
  FaChartBar,
  FaDollarSign,
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaFilter,
  FaArrowLeft,
  FaImage,
  FaCamera,
  FaHeart,
  FaBell,
  FaSignOutAlt,
  FaCog,
  FaHeadset,
  FaFileAlt,
  FaArrowRight,
  FaShoppingCart,
  FaTrash,
  FaCut,
  FaCoffee,
  FaLightbulb,
  FaChevronLeft,
  FaChevronRight,
  FaArrowUp,
  FaCircle,
  FaStore,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaUsers,
  FaPlus,
  FaEdit
} from "react-icons/fa";

export const Icons = {
  // Navigation
  home: FaHome,
  calendar: FaCalendar,
  gift: FaGift,
  profile: FaUser,
  dashboard: FaChartBar,
  earnings: FaDollarSign,
  cart: FaShoppingCart,

  // Common
  star: FaStar,
  location: FaMapMarkerAlt,
  clock: FaClock,
  check: FaCheck,
  times: FaTimes,
  phone: FaPhone,
  email: FaEnvelope,
  lock: FaLock,
  eye: FaEye,
  eyeSlash: FaEyeSlash,
  search: FaSearch,
  filter: FaFilter,
  back: FaArrowLeft,
  "arrow-right": FaArrowRight,
  image: FaImage,
  camera: FaCamera,
  heart: FaHeart,
  bell: FaBell,
  logout: FaSignOutAlt,
  settings: FaCog,
  support: FaHeadset,
  terms: FaFileAlt,
  delete: FaTrash,

  // New replacements for emojis
  cut: FaCut,
  coffee: FaCoffee,
  lightbulb: FaLightbulb,
  chevronLeft: FaChevronLeft,
  chevronRight: FaChevronRight,
  arrowUp: FaArrowUp,
  circle: FaCircle,
  store: FaStore,
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: FaTwitter,
  youtube: FaYoutube,
  users: FaUsers,
  scissors: FaCut,
  plus: FaPlus,
  edit: FaEdit
};

export type IconKey = keyof typeof Icons;

interface IconProps {
  icon: IconKey;
  size?: number;
  className?: string;
}

export function Icon({ icon, size = 20, className = "" }: IconProps) {
  const IconComponent = Icons[icon];
  return <IconComponent size={size} className={className} />;
}
