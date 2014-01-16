# Models

Some thoughts on how will be the models/database architecture

```javascript
User = {
  name: String
  email: String
  followers: [User]
  following: [User]
  inactive: Boolean
  (isAdmin: Boolean)
  (isEditor: Boolean)
}
 
(UserPrileveges = {
  title: String
  priveleges: ''
})
 
Activity = {
  user: User
  type: ActivityType
  date: Date
}
 
ActivityType = {
  title: String
  template: String
}
 
Star = {
  user: User
  target: Map || Feature || Layer || Media
  date: Date
  inactive: Boolean
}
 
Feature = {
  creator: User
  geometry: GeoJSON Feature
  version: Number
  createdAt: Date
  updatedAt: Date
  creator: User
  tags: [String]
  medias: [Media]
  visibility: Enum {Public, Visible, Private}
  stars: [Star]
}
 
Media = {
  creator: User
  version: Number
  createdAt: Date
  updatedAt: Date
  content: SirTrevor || String
  type: Enum {'Data', 'Post', 'Video', 'Image Gallery'}
  features: [Feature]
  layers: [Layer]
  maps: [Map]
  stars: [Star]
}
 
LayerObject = {
  creator: User
  title: String
  createdAt: Date
  updatedAt: Date
  visibility: Enum {Public, Visible, Private}
  stars: [Star]
  tags: [String]
}
 
FeatureLayer = {
  medias: [Media]
  features: [{
    Feature: feature_id,
    [Media]
  }]
}
 
TileLayer = {
  url: String
  attribution: String
  center: [Number, Number, Number]
  bounds: [Number, Number, Number, Number]
}
 
TileJsonLayer = {
  url: String
}
 
Map = {
  creator: User
  createdAt: Date
  updatedAt: Date
  maxZoom: Number
  minZoom: Number
  center: [Number, Number, Number]
  bounds: [Number, Number, Number, Number]
  visibility: Enum {Public, Visible, Private}
  layout: Enum {Scroll, Timeline}
  tags: [String]
  medias: [Media]
  stars: [Star]
}
```