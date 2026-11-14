-- Profile pictures: a path served by the API (/v1/core/avatars/<seed>.svg). Forum posts already have author_avatar.
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE m07_buddy_requests ADD COLUMN IF NOT EXISTS user_avatar TEXT;
