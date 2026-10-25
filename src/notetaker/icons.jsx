import { useMemo, useState } from 'react';
import {
  Activity, Album, Anchor, Archive, Atom, Baby, Backpack, Banknote, Bell, Bike, Binary, Bird,
  Book, BookMarked, BookOpen, Bookmark, Bot, Box, Boxes, Brain, Briefcase, Brush, Bug, Building,
  Calculator, Calendar, Camera, Car, Cat, ChevronDown, ChevronRight, Circle, ClipboardList, Clock,
  Cloud, Code, Coffee, Coins, Compass, Cpu, CreditCard, Crown, Database, Dna, Dog, DollarSign,
  Droplet, Dumbbell, Ear, Earth, Eye, File, Files, FileText, Film, Fingerprint, Flag, Flame,
  FlaskConical, Flower, Folder, FolderOpen, Footprints, Gamepad2, Gauge, Gem, Ghost, Gift, Globe,
  GraduationCap, Grid, Guitar, Hammer, Hand, HardDrive, Headphones, Heart, Hexagon, Image, Key,
  Keyboard, Landmark, Languages, Laptop, Layers, Leaf, Library, Lightbulb, Link, List, Lock, Mail,
  Map, MapPin, Mic, Microscope, Monitor, Moon, Mountain, Mouse, Music, Notebook, NotebookPen,
  Palette, Paperclip, PenTool, Phone, Pill, Pin, Pizza, Plane, Play, Plug, Puzzle, Rocket, Sailboat,
  Scale, School, Server, Settings, Shield, ShoppingCart, Sigma, Skull, Smartphone, Smile, Sparkles,
  Square, Star, Stethoscope, Sun, Tablet, Tag, Tags, Target, Terminal, Theater, Timer, Train, Trees,
  TrendingUp, Trophy, Tv, User, Users, Video, Volume2, Wand2, Waves, Wifi, Wind, Wrench, Zap,
} from 'lucide-react';

export const ICONS = {
  folder: Folder,
  'folder-open': FolderOpen,
  note: FileText,
  book: Book,
  'book-open': BookOpen,
  'book-marked': BookMarked,
  bookmark: Bookmark,
  notebook: Notebook,
  'notebook-pen': NotebookPen,
  school: School,
  graduation: GraduationCap,
  library: Library,
  backpack: Backpack,
  clipboard: ClipboardList,
  files: Files,
  file: File,
  archive: Archive,
  box: Box,
  boxes: Boxes,
  layers: Layers,
  grid: Grid,
  list: List,
  atom: Atom,
  flask: FlaskConical,
  microscope: Microscope,
  dna: Dna,
  calculator: Calculator,
  sigma: Sigma,
  binary: Binary,
  code: Code,
  terminal: Terminal,
  cpu: Cpu,
  database: Database,
  server: Server,
  harddrive: HardDrive,
  monitor: Monitor,
  laptop: Laptop,
  smartphone: Smartphone,
  tablet: Tablet,
  keyboard: Keyboard,
  mouse: Mouse,
  plug: Plug,
  wifi: Wifi,
  bot: Bot,
  brain: Brain,
  sparkles: Sparkles,
  wand: Wand2,
  lightbulb: Lightbulb,
  puzzle: Puzzle,
  globe: Globe,
  earth: Earth,
  compass: Compass,
  map: Map,
  pin: MapPin,
  flag: Flag,
  target: Target,
  rocket: Rocket,
  activity: Activity,
  gauge: Gauge,
  trending: TrendingUp,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  bell: Bell,
  languages: Languages,
  palette: Palette,
  brush: Brush,
  pen: PenTool,
  image: Image,
  camera: Camera,
  film: Film,
  video: Video,
  tv: Tv,
  music: Music,
  album: Album,
  guitar: Guitar,
  headphones: Headphones,
  microphone: Mic,
  volume: Volume2,
  play: Play,
  theater: Theater,
  gamepad: Gamepad2,
  trophy: Trophy,
  dumbbell: Dumbbell,
  heartbeat: Heart,
  'stethoscope': Stethoscope,
  pill: Pill,
  leaf: Leaf,
  trees: Trees,
  flower: Flower,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  droplet: Droplet,
  wind: Wind,
  waves: Waves,
  mountain: Mountain,
  flame: Flame,
  zap: Zap,
  bug: Bug,
  bird: Bird,
  cat: Cat,
  dog: Dog,
  footprints: Footprints,
  users: Users,
  user: User,
  baby: Baby,
  hand: Hand,
  ear: Ear,
  eye: Eye,
  fingerprint: Fingerprint,
  'briefcase': Briefcase,
  building: Building,
  landmark: Landmark,
  scale: Scale,
  banknote: Banknote,
  coins: Coins,
  dollar: DollarSign,
  'credit-card': CreditCard,
  cart: ShoppingCart,
  gift: Gift,
  tag: Tag,
  tags: Tags,
  'coffee': Coffee,
  pizza: Pizza,
  anchor: Anchor,
  sailboat: Sailboat,
  plane: Plane,
  car: Car,
  train: Train,
  bike: Bike,
  shield: Shield,
  lock: Lock,
  key: Key,
  link: Link,
  paperclip: Paperclip,
  mail: Mail,
  phone: Phone,
  settings: Settings,
  wrench: Wrench,
  hammer: Hammer,
  star: Star,
  heart: Heart,
  crown: Crown,
  gem: Gem,
  skull: Skull,
  ghost: Ghost,
  smile: Smile,
  circle: Circle,
  square: Square,
  hexagon: Hexagon,
  arrow: ChevronRight,
  chevron: ChevronDown,
};

export const DEFAULT_ICON = { folder: 'folder', note: 'note' };

export const iconNode = (name, size = 16, props = {}) => {
  const Cmp = ICONS[name] || ICONS.note;
  if (!Cmp) return <FileText size={size} {...props} />;
  return <Cmp size={size} {...props} />;
};

const LABELS = {
  'folder-open': 'folder open',
  'book-open': 'book open',
  'book-marked': 'book marked',
  'notebook-pen': 'notebook pen',
  harddrive: 'hard drive',
  lightbulb: 'light bulb',
  'credit-card': 'credit card',
};

export const IconPicker = ({ value, onPick, onClose }) => {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const entries = Object.entries(ICONS).filter(([, C]) => !!C);
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(([k]) => (LABELS[k] || k).includes(term));
  }, [q]);

  return (
    <div className="nt-pop" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search icons"
        className="nt-input nt-input-sm"
      />
      <div className="nt-icon-grid">
        {list.map(([key, Cmp]) => (
          <button
            key={key}
            type="button"
            title={LABELS[key] || key}
            onClick={() => { onPick(key); onClose?.(); }}
            className={'nt-icon-cell' + (value === key ? ' is-active' : '')}
          >
            <Cmp size={16} />
          </button>
        ))}
        {!list.length && <p className="nt-muted nt-small">No icon matches that.</p>}
      </div>
    </div>
  );
};
