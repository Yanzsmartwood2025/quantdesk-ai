file_path = "web/src/components/dashboard/Dashboard.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Fix Horizontal Scroll for categories
# We remove flex-wrap and replace it with flex-nowrap, overflow-x-auto, max-w-full
# Need to make sure it scrolls smoothly. Also removing max-w so it takes full width and can scroll.
search_categories = """        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-[#131722] p-1 rounded-lg border border-gray-800">"""
replace_categories = """        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto overflow-hidden">
          <div className="flex flex-nowrap overflow-x-auto w-full items-center gap-2 bg-[#131722] p-1 rounded-lg border border-gray-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">"""

content = content.replace(search_categories, replace_categories)

# 2. Fix the scroll layout on mobile
# h-[calc(100vh-120px)] forces the entire grid to have a fixed height which is problematic on mobile where it stacks.
# It's better to only constrain height on desktop, or adjust for mobile.
# We will remove `h-[calc(100vh-120px)]` from the grid and apply it only on lg screens, or give min-heights.
# Let's change the grid height class:
search_grid = """<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">"""
replace_grid = """<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[calc(100vh-120px)]">"""
content = content.replace(search_grid, replace_grid)

# Change the left column layout
# It had `overflow-hidden h-full`. On mobile, `h-full` might not be enough if parent is `h-auto`.
# We should give the feed a min-height on mobile so it can be scrolled.
search_col1 = """          {/* Left Column: Agents & Feed */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-full">"""
replace_col1 = """          {/* Left Column: Agents & Feed */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-auto lg:h-full">"""
content = content.replace(search_col1, replace_col1)

# Ensure ReasoningFeed has a minimum height on mobile so it's not a tiny empty bar.
search_feed = """            <div className="flex-1 overflow-hidden mt-2">
              <ReasoningFeed traces={traces} />
            </div>"""
replace_feed = """            <div className="flex-1 overflow-hidden mt-2 min-h-[300px] lg:min-h-0 flex flex-col">
              <ReasoningFeed traces={traces} />
            </div>"""
content = content.replace(search_feed, replace_feed)


# Also ensure that select button in categories doesn't shrink text on mobile horizontally, might need whitespace-nowrap.
search_button = """                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${"""
replace_button = """                className={`whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-md transition-all ${"""
content = content.replace(search_button, replace_button)

with open(file_path, "w") as f:
    f.write(content)
