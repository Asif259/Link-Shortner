export interface StatMetric {
  title: string;
  value: string;
  change: string;
  period: string;
  isPositive: boolean;
  sparkline: number[];
}

export interface ChartDataPoint {
  date: string;
  clicks: number;
  unique: number;
}

export interface ActivityItem {
  id: string;
  country: string;
  countryCode: string;
  device: string;
  browser: string;
  timestamp: string;
}

export interface DeviceShare {
  name: string;
  percentage: number;
  clicks: number;
  color: string;
}

export interface TopLink {
  id: string;
  shortCode: string;
  destination: string;
  clicks: number;
  rank: number;
}

export interface ShareItem {
  name: string;
  percentage: number;
  count: number;
  color?: string;
}

export interface RecentLink {
  id: string;
  shortUrl: string;
  fullShortUrl: string;
  destination: string;
  clicks: number;
  status: 'Active' | 'Paused';
  createdAt: string;
}

export const mockDashboardData = {
  stats: [
    {
      title: 'Total Clicks',
      value: '24,891',
      change: '+12.4%',
      period: 'vs previous period',
      isPositive: true,
      sparkline: [210, 240, 280, 260, 310, 340, 390],
    },
    {
      title: 'Unique Visitors',
      value: '8,421',
      change: '+8.2%',
      period: 'vs previous period',
      isPositive: true,
      sparkline: [95, 110, 105, 125, 130, 142, 160],
    },
    {
      title: 'Active Links',
      value: '47',
      change: '+5',
      period: 'this month',
      isPositive: true,
      sparkline: [38, 40, 42, 42, 44, 45, 47],
    },
    {
      title: 'Clicks Today',
      value: '1,284',
      change: '+18.7%',
      period: 'vs yesterday',
      isPositive: true,
      sparkline: [80, 110, 140, 210, 320, 290, 360],
    },
  ] as StatMetric[],

  chartData: {
    '7 Days': [
      { date: 'Mon', clicks: 340, unique: 180 },
      { date: 'Tue', clicks: 420, unique: 230 },
      { date: 'Wed', clicks: 380, unique: 195 },
      { date: 'Thu', clicks: 490, unique: 280 },
      { date: 'Fri', clicks: 610, unique: 340 },
      { date: 'Sat', clicks: 530, unique: 290 },
      { date: 'Sun', clicks: 480, unique: 260 },
    ],
    '30 Days': [
      { date: 'Sep 01', clicks: 320, unique: 170 },
      { date: 'Sep 04', clicks: 410, unique: 210 },
      { date: 'Sep 07', clicks: 380, unique: 190 },
      { date: 'Sep 10', clicks: 460, unique: 240 },
      { date: 'Sep 13', clicks: 580, unique: 310 },
      { date: 'Sep 16', clicks: 520, unique: 280 },
      { date: 'Sep 19', clicks: 640, unique: 360 },
      { date: 'Sep 22', clicks: 710, unique: 410 },
      { date: 'Sep 25', clicks: 690, unique: 380 },
      { date: 'Sep 28', clicks: 790, unique: 440 },
      { date: 'Oct 01', clicks: 880, unique: 510 },
    ],
    '3 Months': [
      { date: 'Aug W1', clicks: 2100, unique: 1100 },
      { date: 'Aug W2', clicks: 2400, unique: 1250 },
      { date: 'Aug W3', clicks: 2650, unique: 1380 },
      { date: 'Aug W4', clicks: 2900, unique: 1520 },
      { date: 'Sep W1', clicks: 3100, unique: 1650 },
      { date: 'Sep W2', clicks: 3450, unique: 1820 },
      { date: 'Sep W3', clicks: 3900, unique: 2050 },
      { date: 'Sep W4', clicks: 4200, unique: 2200 },
    ],
  } as Record<string, ChartDataPoint[]>,

  recentActivity: [
    {
      id: 'act-1',
      country: 'Bangladesh',
      countryCode: 'BD',
      device: 'Mobile',
      browser: 'Chrome',
      timestamp: '2 minutes ago',
    },
    {
      id: 'act-2',
      country: 'India',
      countryCode: 'IN',
      device: 'Desktop',
      browser: 'Chrome',
      timestamp: '5 minutes ago',
    },
    {
      id: 'act-3',
      country: 'United States',
      countryCode: 'US',
      device: 'Mobile',
      browser: 'Safari',
      timestamp: '8 minutes ago',
    },
    {
      id: 'act-4',
      country: 'Bangladesh',
      countryCode: 'BD',
      device: 'Desktop',
      browser: 'Edge',
      timestamp: '12 minutes ago',
    },
    {
      id: 'act-5',
      country: 'Germany',
      countryCode: 'DE',
      device: 'Desktop',
      browser: 'Firefox',
      timestamp: '19 minutes ago',
    },
  ] as ActivityItem[],

  devices: [
    { name: 'Mobile', percentage: 68, clicks: 16925, color: '#236B56' },
    { name: 'Desktop', percentage: 27, clicks: 6720, color: '#3BA385' },
    { name: 'Tablet', percentage: 5, clicks: 1246, color: '#88D4BE' },
  ] as DeviceShare[],

  topLinks: [
    { id: '1', shortCode: '/portfolio', destination: 'ashrafulasif.dev', clicks: 4821, rank: 1 },
    { id: '2', shortCode: '/github', destination: 'github.com/Asif1416', clicks: 3284, rank: 2 },
    { id: '3', shortCode: '/course', destination: 'codinzy.com/course', clicks: 2941, rank: 3 },
    { id: '4', shortCode: '/youtube', destination: 'youtube.com/@asif', clicks: 1821, rank: 4 },
    { id: '5', shortCode: '/resume', destination: 'ashrafulasif.dev/resume', clicks: 1102, rank: 5 },
  ] as TopLink[],

  countries: [
    { name: 'Bangladesh', percentage: 42, count: 10454, color: '#236B56' },
    { name: 'India', percentage: 21, count: 5227, color: '#2F856D' },
    { name: 'United States', percentage: 17, count: 4231, color: '#43A488' },
    { name: 'United Kingdom', percentage: 9, count: 2240, color: '#6EC3A9' },
    { name: 'Others', percentage: 11, count: 2739, color: '#B3E4D5' },
  ] as ShareItem[],

  browsers: [
    { name: 'Chrome', percentage: 71, count: 17672, color: '#236B56' },
    { name: 'Safari', percentage: 17, count: 4231, color: '#38A184' },
    { name: 'Edge', percentage: 8, count: 1991, color: '#66C3A7' },
    { name: 'Firefox', percentage: 4, count: 997, color: '#A5E0CF' },
  ] as ShareItem[],

  recentLinks: [
    {
      id: 'rec-1',
      shortUrl: '/portfolio',
      fullShortUrl: 'https://link.ly/portfolio',
      destination: 'https://ashrafulasif.dev',
      clicks: 842,
      status: 'Active',
      createdAt: 'Today, 09:15 AM',
    },
    {
      id: 'rec-2',
      shortUrl: '/github',
      fullShortUrl: 'https://link.ly/github',
      destination: 'https://github.com/Asif1416',
      clicks: 621,
      status: 'Active',
      createdAt: 'Yesterday',
    },
    {
      id: 'rec-3',
      shortUrl: '/course',
      fullShortUrl: 'https://link.ly/course',
      destination: 'https://codinzy.com/course',
      clicks: 421,
      status: 'Active',
      createdAt: '2 days ago',
    },
    {
      id: 'rec-4',
      shortUrl: '/youtube',
      fullShortUrl: 'https://link.ly/youtube',
      destination: 'https://youtube.com/@asif',
      clicks: 298,
      status: 'Active',
      createdAt: '5 days ago',
    },
    {
      id: 'rec-5',
      shortUrl: '/newsletter',
      fullShortUrl: 'https://link.ly/newsletter',
      destination: 'https://substack.com/@asif',
      clicks: 142,
      status: 'Active',
      createdAt: '1 week ago',
    },
  ] as RecentLink[],
};
