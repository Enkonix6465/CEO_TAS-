import React from "react";
import {
  Star,
  Settings,
  Share2,
  Search,
  Filter,
  ChevronDown,
  Plus,
} from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  tabs?: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<any>;
    active?: boolean;
  }>;
  onTabChange?: (tabId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showFilters?: boolean;
  filterOpen?: boolean;
  onFilterToggle?: () => void;
  filterContent?: React.ReactNode;
  showActions?: boolean;
  customActions?: React.ReactNode;
  showShare?: boolean;
  showSettings?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  status = "Active",
  statusColor = "bg-green-100 text-green-700",
  tabs = [],
  onTabChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search",
  showFilters = true,
  filterOpen = false,
  onFilterToggle,
  filterContent,
  showActions = true,
  customActions,
  showShare = true,
  showSettings = true,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor}`}>
            {status}
          </span>
          <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <Star className="w-4 h-4 text-gray-400" />
          </button>
          {subtitle && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </span>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            {customActions}
            {showShare && (
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Share
              </button>
            )}
            {showSettings && (
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar Row */}
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`flex items-center gap-2 pb-2 transition-colors ${
                tab.active
                  ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {onSearchChange && (
            <div className="relative search-input">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Filters */}
          {showFilters && onFilterToggle && (
            <div className="relative">
              <button
                onClick={onFilterToggle}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Filter className="w-4 h-4" />
                Filter
                <ChevronDown className="w-4 h-4" />
              </button>

              {filterOpen && filterContent && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999] p-4">
                  {filterContent}
                </div>
              )}
            </div>
          )}

          {/* Add Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
