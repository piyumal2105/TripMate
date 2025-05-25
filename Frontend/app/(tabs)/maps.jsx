import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Linking,
  Modal,
  Alert,
  Image,
  TextInput,
  Share,
} from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { auth } from "../../configs/FirebaseConfig.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const db = getFirestore();
const { width, height } = Dimensions.get("window");

const SRI_LANKA_BOUNDS = {
  northEast: { latitude: 9.9, longitude: 81.9 },
  southWest: { latitude: 5.9, longitude: 79.5 },
};

const SRI_LANKA_CENTER = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

// Enhanced Place Information Modal Component
const PlaceInfoModal = ({ place, visible, onClose }) => {
  const [placeInfo, setPlaceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Debounced search
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (visible && place) {
      fetchPlaceInformation();
    }
  }, [visible, place]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (placeInfo?.photos && searchQuery.trim()) {
        const filtered = placeInfo.photos.filter(
          (photo) =>
            photo.alt_description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            photo.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            photo.user?.name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            photo.tags?.some((tag) =>
              tag.title?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        setFilteredPhotos(filtered);
      } else {
        setFilteredPhotos(placeInfo?.photos || []);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, placeInfo?.photos]);

  const fetchPlaceInformation = async () => {
    setLoading(true);
    setError(null);

    try {
      const [wikiInfo, weatherInfo, photosInfo] = await Promise.allSettled([
        fetchWikipediaInfo(),
        fetchWeatherInfo(),
        fetchPhotosInfo(),
      ]);

      const combinedInfo = {
        wikipedia: wikiInfo.status === "fulfilled" ? wikiInfo.value : null,
        weather: weatherInfo.status === "fulfilled" ? weatherInfo.value : null,
        photos: photosInfo.status === "fulfilled" ? photosInfo.value : null,
      };

      setPlaceInfo(combinedInfo);
    } catch (err) {
      setError("Failed to fetch place information");
      console.error("Error fetching place info:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWikipediaInfo = async () => {
    try {
      const searchResponse = await axios.get(
        "https://en.wikipedia.org/api/rest_v1/page/summary/" +
          encodeURIComponent(place.name),
        { timeout: 10000 }
      );

      if (searchResponse.data) {
        return {
          title: searchResponse.data.title,
          extract: searchResponse.data.extract,
          thumbnail: searchResponse.data.thumbnail?.source,
          pageUrl: searchResponse.data.content_urls?.desktop?.page,
        };
      }
    } catch (error) {
      try {
        const searchResponse = await axios.get(
          "https://en.wikipedia.org/w/api.php",
          {
            params: {
              action: "query",
              format: "json",
              list: "search",
              srsearch: `${place.name} Sri Lanka`,
              origin: "*",
            },
            timeout: 10000,
          }
        );

        if (searchResponse.data.query.search.length > 0) {
          const pageTitle = searchResponse.data.query.search[0].title;
          const summaryResponse = await axios.get(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              pageTitle
            )}`,
            { timeout: 10000 }
          );

          return {
            title: summaryResponse.data.title,
            extract: summaryResponse.data.extract,
            thumbnail: summaryResponse.data.thumbnail?.source,
            pageUrl: summaryResponse.data.content_urls?.desktop?.page,
          };
        }
      } catch (innerError) {
        console.log("Wikipedia search failed:", innerError);
      }
    }
    return null;
  };

  const fetchWeatherInfo = async () => {
    try {
      // You can replace this with a real weather API like OpenWeatherMap
      // For now, using mock data but structured for real API integration
      return {
        temperature: Math.floor(Math.random() * 10) + 25,
        description: ["Sunny", "Partly cloudy", "Cloudy", "Light rain"][
          Math.floor(Math.random() * 4)
        ],
        humidity: Math.floor(Math.random() * 30) + 60,
        windSpeed: Math.floor(Math.random() * 15) + 5,
      };
    } catch (error) {
      return null;
    }
  };

  const fetchPhotosInfo = async () => {
    setPhotosLoading(true);
    try {
      // Using Unsplash API for dynamic photo fetching
      const UNSPLASH_ACCESS_KEY = "YOUR_UNSPLASH_ACCESS_KEY"; // Replace with your actual API key

      if (
        !UNSPLASH_ACCESS_KEY ||
        UNSPLASH_ACCESS_KEY === "YOUR_UNSPLASH_ACCESS_KEY"
      ) {
        // Fallback to demo mode with fewer, more realistic photos
        console.log("No Unsplash API key found, using demo photos");
        return getDemoPhotos();
      }

      // Search for photos related to the place
      const searchQueries = [
        `${place.name} Sri Lanka`,
        `${place.location} Sri Lanka`,
        `Sri Lanka ${place.category}`,
        "Sri Lanka landscape",
        "Sri Lanka tourism",
      ];

      const photoPromises = searchQueries.map(async (query) => {
        try {
          const response = await axios.get(
            "https://api.unsplash.com/search/photos",
            {
              params: {
                query: query,
                per_page: 5,
                orientation: "landscape",
                content_filter: "high",
              },
              headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
              },
              timeout: 8000,
            }
          );
          return response.data.results || [];
        } catch (error) {
          console.log(`Failed to fetch photos for query: ${query}`, error);
          return [];
        }
      });

      const photoResults = await Promise.allSettled(photoPromises);
      const allPhotos = photoResults
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .filter(
          (photo, index, self) =>
            // Remove duplicates based on photo ID
            index === self.findIndex((p) => p.id === photo.id)
        );

      if (allPhotos.length === 0) {
        return getDemoPhotos();
      }

      // Transform Unsplash data to our format
      return allPhotos.slice(0, 12).map((photo) => ({
        id: photo.id,
        url: photo.urls.small,
        fullUrl: photo.urls.regular,
        photographer: photo.user.name,
        description:
          photo.alt_description ||
          photo.description ||
          `Beautiful view of ${place.name}`,
        category:
          getCategoryFromTags(photo.tags) || place.category || "Landscape",
        likes: photo.likes || 0,
        downloads: photo.downloads || 0,
        tags: photo.tags || [],
        user: photo.user,
        alt_description: photo.alt_description,
      }));
    } catch (error) {
      console.error("Error fetching photos from Unsplash:", error);
      return getDemoPhotos();
    } finally {
      setPhotosLoading(false);
    }
  };

  const getCategoryFromTags = (tags) => {
    if (!tags || tags.length === 0) return null;

    const categoryMapping = {
      landscape: "Landscape",
      nature: "Nature",
      architecture: "Architecture",
      temple: "Heritage",
      beach: "Beach",
      wildlife: "Wildlife",
      culture: "Culture",
      sunset: "Sunset",
      mountain: "Mountain",
      forest: "Forest",
    };

    for (const tag of tags) {
      const tagTitle = tag.title?.toLowerCase();
      if (categoryMapping[tagTitle]) {
        return categoryMapping[tagTitle];
      }
    }
    return null;
  };

  const getDemoPhotos = () => {
    // Minimal demo photos when API is not available
    return [
      {
        id: "demo1",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format",
        fullUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format",
        photographer: "Sri Lanka Tourism",
        description: `Scenic landscape of ${place.name}`,
        category: place.category || "Landscape",
        likes: 0,
        downloads: 0,
        tags: [],
        alt_description: `Beautiful view of ${place.name}`,
      },
      {
        id: "demo2",
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&auto=format",
        fullUrl:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
        photographer: "Local Photography",
        description: `Cultural heritage near ${place.name}`,
        category: "Culture",
        likes: 0,
        downloads: 0,
        tags: [],
        alt_description: `Cultural site near ${place.name}`,
      },
    ];
  };

  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
    setPhotoModalVisible(true);
  };

  const handleSharePhoto = async (photo) => {
    try {
      await Share.share({
        message: `Check out this beautiful photo of ${place.name}! 📸 Photo by ${photo.photographer}`,
        url: photo.fullUrl,
      });
    } catch (error) {
      console.error("Error sharing photo:", error);
    }
  };

  const handleDownloadPhoto = (photo) => {
    if (photo.fullUrl) {
      Linking.openURL(photo.fullUrl);
    }
  };

  const TabButton = ({ title, tabKey, icon }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabKey && styles.activeTabButtonText,
        ]}
      >
        {icon} {title}
      </Text>
    </TouchableOpacity>
  );

  const OverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.basicInfoCard}>
        <Text style={styles.infoPlaceTitle}>{place.name}</Text>
        <Text style={styles.placeLocation}>
          📍 {place.location}, {place.province} Province
        </Text>
        <Text style={styles.placeCategory}>🏷️ {place.category}</Text>
        <Text style={styles.infoPlaceDescription}>{place.description}</Text>
      </View>

      {placeInfo?.weather && (
        <View style={styles.weatherCard}>
          <Text style={styles.cardTitle}>🌤️ Current Weather</Text>
          <View style={styles.weatherInfo}>
            <Text style={styles.temperature}>
              {placeInfo.weather.temperature}°C
            </Text>
            <Text style={styles.weatherDescription}>
              {placeInfo.weather.description}
            </Text>
            <View style={styles.weatherDetails}>
              <Text style={styles.weatherDetail}>
                💧 Humidity: {placeInfo.weather.humidity}%
              </Text>
              <Text style={styles.weatherDetail}>
                💨 Wind: {placeInfo.weather.windSpeed} km/h
              </Text>
            </View>
          </View>
        </View>
      )}

      {placeInfo?.wikipedia && (
        <View style={styles.wikiCard}>
          <Text style={styles.cardTitle}>📚 About {place.name}</Text>
          {placeInfo.wikipedia.thumbnail && (
            <Image
              source={{ uri: placeInfo.wikipedia.thumbnail }}
              style={styles.wikiImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.wikiExtract}>{placeInfo.wikipedia.extract}</Text>
          {placeInfo.wikipedia.pageUrl && (
            <TouchableOpacity
              style={styles.wikiButton}
              onPress={() => Linking.openURL(placeInfo.wikipedia.pageUrl)}
            >
              <Text style={styles.wikiButtonText}>Read more →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );

  const PhotosTab = () => (
    <View style={styles.photosTabContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search photos by description, photographer, or tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo Stats */}
      <View style={styles.photoStatsContainer}>
        <Text style={styles.photoStatsText}>
          📸 {filteredPhotos.length} photos available
        </Text>
        {searchQuery && (
          <Text style={styles.searchResultText}>
            Showing results for "{searchQuery}"
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.photosScrollView}
        showsVerticalScrollIndicator={false}
      >
        {photosLoading ? (
          <View style={styles.photosLoadingContainer}>
            <ActivityIndicator size="large" color="#0478A7" />
            <Text style={styles.photosLoadingText}>Loading photos...</Text>
          </View>
        ) : filteredPhotos && filteredPhotos.length > 0 ? (
          <View style={styles.photosGrid}>
            {filteredPhotos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id || index}
                style={styles.photoContainer}
                onPress={() => handlePhotoPress(photo)}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <View style={styles.photoHeader}>
                    <Text style={styles.photoCategory}>{photo.category}</Text>
                    <View style={styles.photoStats}>
                      <Text style={styles.photoLikes}>❤️ {photo.likes}</Text>
                    </View>
                  </View>
                  <Text style={styles.photoDescription} numberOfLines={2}>
                    {photo.description}
                  </Text>
                  <Text style={styles.photographerText}>
                    📸 {photo.photographer}
                  </Text>
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={() => handleSharePhoto(photo)}
                    >
                      <Text style={styles.photoActionText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={() => handleDownloadPhoto(photo)}
                    >
                      <Text style={styles.photoActionText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noPhotosContainer}>
            <Text style={styles.noPhotosText}>
              {searchQuery ? "🔍 No photos found" : "📷 No photos available"}
            </Text>
            <Text style={styles.noPhotosSubText}>
              {searchQuery
                ? "Try a different search term"
                : "Photos will load automatically when available"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Photo Detail Modal */}
      <Modal
        visible={photoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.photoModalContainer}>
          <TouchableOpacity
            style={styles.photoModalBackground}
            activeOpacity={1}
            onPress={() => setPhotoModalVisible(false)}
          >
            <View style={styles.photoModalContent}>
              {selectedPhoto && (
                <>
                  <Image
                    source={{ uri: selectedPhoto.fullUrl }}
                    style={styles.fullPhotoImage}
                    resizeMode="contain"
                  />
                  <View style={styles.photoModalInfo}>
                    <Text style={styles.photoModalTitle}>
                      {selectedPhoto.description}
                    </Text>
                    <Text style={styles.photoModalPhotographer}>
                      📸 {selectedPhoto.photographer}
                    </Text>
                    <View style={styles.photoModalStats}>
                      <Text style={styles.photoModalStat}>
                        ❤️ {selectedPhoto.likes} likes
                      </Text>
                      <Text style={styles.photoModalStat}>
                        ⬇️ {selectedPhoto.downloads} downloads
                      </Text>
                      <Text style={styles.photoModalStat}>
                        🏷️ {selectedPhoto.category}
                      </Text>
                    </View>
                    <View style={styles.photoModalActions}>
                      <TouchableOpacity
                        style={styles.photoModalButton}
                        onPress={() => handleSharePhoto(selectedPhoto)}
                      >
                        <Text style={styles.photoModalButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.photoModalButton}
                        onPress={() => handleDownloadPhoto(selectedPhoto)}
                      >
                        <Text style={styles.photoModalButtonText}>
                          Open Full Size
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.infoModalContainer}>
        <View style={styles.infoModalHeader}>
          <Text style={styles.infoModalTitle} numberOfLines={1}>
            ℹ️ {place?.name}
          </Text>
          <TouchableOpacity style={styles.infoCloseButton} onPress={onClose}>
            <Text style={styles.infoCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabNavigation}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            <TabButton title="Overview" tabKey="overview" icon="📋" />
            <TabButton title="Photos" tabKey="photos" icon="📸" />
          </ScrollView>
        </View>

        <View style={styles.infoContent}>
          {loading ? (
            <View style={styles.infoLoadingContainer}>
              <ActivityIndicator size="large" color="#0478A7" />
              <Text style={styles.infoLoadingText}>
                Loading place information...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.infoErrorContainer}>
              <Text style={styles.infoErrorText}>⚠️ {error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchPlaceInformation}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "photos" && <PhotosTab />}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Updated 360° Modal Component with blue theme
const InApp360Modal = ({ place, visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [currentViewType, setCurrentViewType] = useState("360cities");
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (visible && place) {
      setLoading(true);
      setWebViewKey((prev) => prev + 1);
    }
  }, [visible, place, currentViewType]);

  const get360CitiesURL = () => {
    const lat = parseFloat(place?.latitude || 0);
    const lng = parseFloat(place?.longitude || 0);
    return `https://www.360cities.net/area/sri-lanka?embed=true&autoplay=true&lat=${lat}&lng=${lng}`;
  };

  const getStreetViewURL = () => {
    const lat = parseFloat(place?.latitude || 0);
    const lng = parseFloat(place?.longitude || 0);
    if (isNaN(lat) || isNaN(lng)) return null;
    return `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=embed`;
  };

  const getGoogleEarthURL = () => {
    const lat = parseFloat(place?.latitude || 0);
    const lng = parseFloat(place?.longitude || 0);
    if (isNaN(lat) || isNaN(lng)) return null;
    return `https://earth.google.com/web/search/${place.name}/@${lat},${lng},1000a,1000d,35y,0h,0t,0r`;
  };

  const getCurrentURL = () => {
    switch (currentViewType) {
      case "360cities":
        return get360CitiesURL();
      case "streetview":
        return getStreetViewURL();
      case "googleearth":
        return getGoogleEarthURL();
      default:
        return get360CitiesURL();
    }
  };

  const WebIframeView = () => {
    const iframeRef = useRef(null);

    useEffect(() => {
      if (iframeRef.current && typeof document !== "undefined") {
        const iframe = document.createElement("iframe");
        iframe.src = getCurrentURL();
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "12px";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullScreen = true;
        iframe.onload = () => setLoading(false);
        iframe.onerror = () => setLoading(false);

        iframeRef.current.innerHTML = "";
        iframeRef.current.appendChild(iframe);
      }
    }, [currentViewType]);

    return (
      <div
        ref={iframeRef}
        style={{
          width: "100%",
          height: "450px",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />
    );
  };

  const MobileWebView = () => {
    const currentURL = getCurrentURL();
    if (!currentURL) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load 360° view for this location
          </Text>
        </View>
      );
    }

    return (
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: currentURL }}
        style={styles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#0478A7" />
            <Text style={styles.loadingText}>Loading 360° Experience...</Text>
          </View>
        )}
      />
    );
  };

  const ViewTypeSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.viewTypeSelector}
      contentContainerStyle={styles.viewTypeSelectorContent}
    >
      {[
        { key: "360cities", label: "🌍 360Cities" },
        { key: "streetview", label: "🚶 Street View" },
        { key: "googleearth", label: "🛰️ Earth 3D" },
      ].map((type) => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.viewTypeButton,
            currentViewType === type.key && styles.activeViewTypeButton,
          ]}
          onPress={() => setCurrentViewType(type.key)}
        >
          <Text
            style={[
              styles.viewTypeButtonText,
              currentViewType === type.key && styles.activeViewTypeButtonText,
            ]}
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            🌍 360° View - {place?.name}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ViewTypeSelector />

        <View style={styles.contentContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0478A7" />
              <Text style={styles.loadingText}>Loading 360° Experience...</Text>
            </View>
          )}
          {Platform.OS === "web" ? <WebIframeView /> : <MobileWebView />}
        </View>

        <View style={styles.modalFooter}>
          <Text style={styles.footerText}>
            📍 {place?.location}, {place?.province} Province
          </Text>
          <Text style={styles.footerDescription} numberOfLines={2}>
            {place?.description}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// Updated In-App 360Cities Browser Component with blue theme
const InApp360CitiesBrowser = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);
  const sriLanka360CitiesURL = "https://www.360cities.net/area/sri-lanka";

  const WebBrowserView = () => {
    if (Platform.OS === "web") {
      return (
        <iframe
          src={sriLanka360CitiesURL}
          style={{ width: "100%", height: "100%", border: "none" }}
          onLoad={() => setLoading(false)}
        />
      );
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ uri: sriLanka360CitiesURL }}
        style={styles.browserWebView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        renderLoading={() => (
          <View style={styles.browserLoading}>
            <ActivityIndicator size="large" color="#0478A7" />
            <Text style={styles.browserLoadingText}>Loading 360Cities...</Text>
          </View>
        )}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.browserModalContainer}>
        <View style={styles.browserHeader}>
          <TouchableOpacity style={styles.browserBackButton} onPress={onClose}>
            <Text style={styles.browserBackButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.browserTitle}>360Cities Sri Lanka</Text>
        </View>
        <View style={styles.browserContent}>
          <WebBrowserView />
        </View>
      </View>
    </Modal>
  );
};

// Enhanced Web Map Component with Zoom Controls
const WebMap = ({ places, selectedPlace, onSelectPlace }) => {
  if (Platform.OS !== "web") return null;

  const mapContainerRef = React.useRef(null);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [mapCenter, setMapCenter] = useState({ lat: 7.8731, lng: 80.7718 });

  React.useEffect(() => {
    if (mapContainerRef.current && typeof document !== "undefined") {
      const loadMap = () => {
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";

        let mapUrl;
        if (
          selectedPlace &&
          selectedPlace.latitude &&
          selectedPlace.longitude
        ) {
          const lat = parseFloat(selectedPlace.latitude);
          const lng = parseFloat(selectedPlace.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            const delta = 0.2 / Math.pow(2, zoomLevel - 8);
            mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
              lng - delta
            },${lat - delta},${lng + delta},${
              lat + delta
            }&layer=mapnik&marker=${lat},${lng}`;
            setMapCenter({ lat, lng });
          }
        } else {
          const delta = 4.5 / Math.pow(2, zoomLevel - 8);
          mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
            mapCenter.lng - delta
          },${mapCenter.lat - delta},${mapCenter.lng + delta},${
            mapCenter.lat + delta
          }&layer=mapnik`;
        }

        iframe.src = mapUrl;
        iframe.title = "Sri Lanka Map";

        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
          mapContainerRef.current.appendChild(iframe);
        }
      };
      loadMap();
    }
  }, [selectedPlace, zoomLevel, mapCenter]);

  const handleZoomIn = () => {
    if (zoomLevel < 15) {
      setZoomLevel((prev) => prev + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 5) {
      setZoomLevel((prev) => prev - 1);
    }
  };

  const handleResetView = () => {
    setZoomLevel(8);
    setMapCenter({ lat: 7.8731, lng: 80.7718 });
  };

  return (
    <View style={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      ></div>

      {/* Zoom Controls */}
      <View style={styles.webMapControls}>
        <TouchableOpacity
          style={[
            styles.mapControlButton,
            zoomLevel >= 15 && styles.disabledButton,
          ]}
          onPress={handleZoomIn}
          disabled={zoomLevel >= 15}
        >
          <Text
            style={[
              styles.mapControlText,
              zoomLevel >= 15 && styles.disabledText,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>

        <View style={styles.zoomLevelDisplay}>
          <Text style={styles.zoomLevelText}>{zoomLevel}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.mapControlButton,
            zoomLevel <= 5 && styles.disabledButton,
          ]}
          onPress={handleZoomOut}
          disabled={zoomLevel <= 5}
        >
          <Text
            style={[
              styles.mapControlText,
              zoomLevel <= 5 && styles.disabledText,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetView}>
          <Text style={styles.resetButtonText}>🏠</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Enhanced Mobile Map Component with Zoom Controls
const MobileMap = ({ places, selectedPlace, onSelectPlace }) => {
  if (Platform.OS === "web") return null;

  const mapRef = useRef(null);
  const [currentRegion, setCurrentRegion] = useState(SRI_LANKA_CENTER);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: SRI_LANKA_BOUNDS.northEast.latitude,
            longitude: SRI_LANKA_BOUNDS.northEast.longitude,
          },
          {
            latitude: SRI_LANKA_BOUNDS.southWest.latitude,
            longitude: SRI_LANKA_BOUNDS.southWest.longitude,
          },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: false,
        }
      );
    }
  }, []);

  useEffect(() => {
    if (selectedPlace && selectedPlace.latitude && selectedPlace.longitude) {
      const lat = parseFloat(selectedPlace.latitude);
      const lng = parseFloat(selectedPlace.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        };

        setCurrentRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    }
  }, [selectedPlace, places]);

  const handleZoomIn = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta * 0.5,
      longitudeDelta: currentRegion.longitudeDelta * 0.5,
    };
    setCurrentRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleZoomOut = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.min(currentRegion.latitudeDelta * 2, 10),
      longitudeDelta: Math.min(currentRegion.longitudeDelta * 2, 10),
    };
    setCurrentRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleResetView = () => {
    const resetRegion = SRI_LANKA_CENTER;
    setCurrentRegion(resetRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(resetRegion, 1000);
    }
  };

  const onRegionChangeComplete = (region) => {
    setCurrentRegion(region);
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={SRI_LANKA_CENTER}
        onRegionChangeComplete={onRegionChangeComplete}
        zoomEnabled={true}
        scrollEnabled={true}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {places.map((place, index) => {
          if (place.latitude && place.longitude) {
            const lat = parseFloat(place.latitude);
            const lng = parseFloat(place.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={index}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={place.name}
                  description={place.category || "Tourist Destination"}
                  pinColor={selectedPlace === place ? "#0478A7" : "#FF0000"}
                  onPress={() => onSelectPlace(place)}
                />
              );
            }
          }
          return null;
        })}
      </MapView>

      {/* Mobile Zoom Controls */}
      <View style={styles.mobileMapControls}>
        <TouchableOpacity
          style={[
            styles.mapControlButton,
            currentRegion.latitudeDelta <= 0.01 && styles.disabledButton,
          ]}
          onPress={handleZoomIn}
          disabled={currentRegion.latitudeDelta <= 0.01}
        >
          <Text
            style={[
              styles.mapControlText,
              currentRegion.latitudeDelta <= 0.01 && styles.disabledText,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mapControlButton,
            currentRegion.latitudeDelta >= 10 && styles.disabledButton,
          ]}
          onPress={handleZoomOut}
          disabled={currentRegion.latitudeDelta >= 10}
        >
          <Text
            style={[
              styles.mapControlText,
              currentRegion.latitudeDelta >= 10 && styles.disabledText,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetView}>
          <Text style={styles.resetButtonText}>🏠</Text>
        </TouchableOpacity>
      </View>

      {/* Zoom Level Indicator */}
      <View style={styles.zoomIndicator}>
        <Text style={styles.zoomIndicatorText}>
          Zoom: {Math.round(Math.log2(10 / currentRegion.latitudeDelta))}
        </Text>
      </View>
    </View>
  );
};

// Main Maps Component
export default function Maps() {
  const [travelCategories, setTravelCategories] = useState([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Modal states
  const [inApp360Visible, setInApp360Visible] = useState(false);
  const [selectedPlaceFor360, setSelectedPlaceFor360] = useState(null);
  const [browser360Visible, setBrowser360Visible] = useState(false);
  const [placeInfoVisible, setPlaceInfoVisible] = useState(false);
  const [selectedPlaceForInfo, setSelectedPlaceForInfo] = useState(null);

  const scrollViewRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        fetchUserTravelCategories(user.uid);
      } else {
        setLoading(false);
        setError("User not authenticated. Please login.");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserTravelCategories = async (userId) => {
    try {
      setLoading(true);
      const userPreferencesDoc = await getDoc(
        doc(db, "userPreferences", userId)
      );

      if (
        userPreferencesDoc.exists() &&
        userPreferencesDoc.data().travelCategories
      ) {
        const categories = userPreferencesDoc.data().travelCategories;
        setTravelCategories(categories);
        fetchRecommendedPlaces(categories);
      } else {
        setTravelCategories([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      setError("Failed to load travel categories.");
      setLoading(false);
    }
  };

  const fetchRecommendedPlaces = async (categories) => {
    try {
      let apiUrl;

      if (Platform.OS === "web") {
        apiUrl = "http://localhost:8000/predict/";
      } else if (Platform.OS === "android" && __DEV__) {
        apiUrl = "http://10.0.2.2:8000/predict/";
      } else {
        apiUrl = "http://192.168.1.X:8000/predict/";
      }

      console.log(`Using API URL: ${apiUrl}`);
      const response = await axios.post(apiUrl, { categories });

      console.log("API Response:", response.data.recommended_places);
      setRecommendedPlaces(response.data.recommended_places);
      setLoading(false);
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to fetch recommended places.");
      setLoading(false);
      if (__DEV__) {
        console.log("Using mock data for development");
        setRecommendedPlaces([
          {
            name: "Sigiriya Rock Fortress",
            location: "Sigiriya",
            category: "Heritage",
            province: "Central",
            description: "Ancient rock fortress with frescoes and gardens.",
            latitude: 7.9572,
            longitude: 80.7603,
          },
          {
            name: "Galle Fort",
            location: "Galle",
            category: "Heritage",
            province: "Southern",
            description:
              "Colonial-era fortification and UNESCO World Heritage site.",
            latitude: 6.0269,
            longitude: 80.2171,
          },
          {
            name: "Yala National Park",
            location: "Yala",
            category: "Wildlife",
            province: "Southern",
            description:
              "Famous national park with leopards and diverse wildlife.",
            latitude: 6.3736,
            longitude: 81.5161,
          },
        ]);
        setLoading(false);
      }
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    if (
      Platform.OS === "web" &&
      mapContainerRef.current &&
      scrollViewRef.current
    ) {
      mapContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    if (Platform.OS !== "web" && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 200, animated: true });
    }
  };

  // Modal handlers
  const handle360ViewOpen = (place) => {
    setSelectedPlaceFor360(place);
    setInApp360Visible(true);
  };

  const handle360ViewClose = () => {
    setInApp360Visible(false);
    setSelectedPlaceFor360(null);
  };

  const handleBrowser360Open = () => {
    setBrowser360Visible(true);
  };

  const handleBrowser360Close = () => {
    setBrowser360Visible(false);
  };

  const handlePlaceInfoOpen = (place) => {
    setSelectedPlaceForInfo(place);
    setPlaceInfoVisible(true);
  };

  const handlePlaceInfoClose = () => {
    setPlaceInfoVisible(false);
    setSelectedPlaceForInfo(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0478A7" />
        <Text>Loading your travel preferences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Text style={styles.header}>Your Travel Categories</Text>
      <View style={styles.categoriesContainer}>
        {travelCategories.length > 0 ? (
          travelCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <Text>{category}</Text>
            </View>
          ))
        ) : (
          <Text>No travel categories selected.</Text>
        )}
      </View>

      {/* Enhanced 360Cities Banner with blue theme */}
      <TouchableOpacity
        style={styles.bannerButton}
        onPress={handleBrowser360Open}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Explore Sri Lanka in 360°</Text>
          <Text style={styles.bannerSubtitle}>
            Immersive panoramic views in-app
          </Text>
        </View>
        <Text style={styles.bannerArrow}>→</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Explore Sri Lanka</Text>
      <View
        ref={Platform.OS === "web" ? mapContainerRef : null}
        style={styles.mapContainer}
      >
        {Platform.OS === "web" ? (
          <WebMap
            places={recommendedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
          />
        ) : (
          <MobileMap
            places={recommendedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
          />
        )}
      </View>

      <Text style={styles.header}>Recommended Places</Text>
      <View style={styles.recommendationsContainer}>
        {recommendedPlaces.length > 0 ? (
          recommendedPlaces.map((place, index) => (
            <View
              key={index}
              style={[
                styles.placeItem,
                selectedPlace === place ? styles.selectedPlaceItem : null,
              ]}
            >
              {/* Main content area */}
              <TouchableOpacity
                style={styles.placeMainContent}
                onPress={() => handleSelectPlace(place)}
              >
                <Text style={styles.placeTitle}>{place.name}</Text>
                <Text style={styles.placeDetails}>
                  📍 {place.location || "N/A"}
                </Text>
                <Text style={styles.placeDetails}>
                  🏷 {place.category || "N/A"}
                </Text>
                <Text style={styles.placeDetails}>
                  🌏 {place.province || "N/A"} Province
                </Text>
                <Text style={styles.placeDescription}>
                  {place.description || "No description available."}
                </Text>
              </TouchableOpacity>

              {/* Action buttons row */}
              <View style={styles.placeButtonRow}>
                <TouchableOpacity
                  style={styles.actionButton360}
                  onPress={() => handle360ViewOpen(place)}
                >
                  <Text style={styles.actionButtonText}>🌍 360° View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButtonInfo}
                  onPress={() => handlePlaceInfoOpen(place)}
                >
                  <Text style={styles.actionButtonText}>ℹ️ More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text>No recommendations available.</Text>
        )}
      </View>

      {/* Modals */}
      <InApp360Modal
        place={selectedPlaceFor360}
        visible={inApp360Visible}
        onClose={handle360ViewClose}
      />

      <InApp360CitiesBrowser
        visible={browser360Visible}
        onClose={handleBrowser360Close}
      />

      <PlaceInfoModal
        place={selectedPlaceForInfo}
        visible={placeInfoVisible}
        onClose={handlePlaceInfoClose}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (Previous styles remain the same until the new additions)

  // Updated place description to be justified
  infoPlaceDescription: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    textAlign: "justify", // Added text justification
  },

  // New styles for photos loading
  photosLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  photosLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  // Updated search input for better user experience
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  // ... (All other existing styles remain the same)
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 10,
    color: "#333",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  categoryItem: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#0478A7",
    padding: 8,
    margin: 4,
    borderRadius: 20,
  },
  bannerButton: {
    backgroundColor: "#0478A7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  bannerArrow: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  mapContainer: {
    height: 450,
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // ... (Include all other existing styles)
  infoModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#333",
    marginRight: 10,
  },
  infoCloseButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f1f3f4",
    minWidth: 40,
    alignItems: "center",
  },
  infoCloseButtonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  tabNavigation: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    minWidth: 120,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#0478A7",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: "white",
    fontWeight: "600",
  },
  infoContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  basicInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoPlaceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  placeLocation: {
    fontSize: 16,
    color: "#0478A7",
    marginBottom: 5,
    fontWeight: "500",
  },
  placeCategory: {
    fontSize: 16,
    color: "#0478A7",
    marginBottom: 10,
    fontWeight: "500",
  },
  photosTabContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "bold",
  },
  photoStatsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  photoStatsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  searchResultText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  photosScrollView: {
    flex: 1,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  photoContainer: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  photoImage: {
    width: "100%",
    height: 140,
  },
  photoOverlay: {
    padding: 12,
  },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  photoCategory: {
    fontSize: 11,
    color: "#0478A7",
    fontWeight: "600",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  photoStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  photoLikes: {
    fontSize: 11,
    color: "#e74c3c",
    fontWeight: "500",
  },
  photoDescription: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    marginBottom: 6,
    lineHeight: 16,
  },
  photographerText: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoActionButton: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  photoActionText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noPhotosText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  noPhotosSubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoModalBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  photoModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: width * 0.9,
    maxHeight: height * 0.8,
  },
  fullPhotoImage: {
    width: width * 0.9,
    height: 300,
  },
  photoModalInfo: {
    padding: 16,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  photoModalPhotographer: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  photoModalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  photoModalStat: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  photoModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoModalButton: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  photoModalButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Additional styles for loading and error states
  infoLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoLoadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  infoErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoErrorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  weatherCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  weatherInfo: {
    alignItems: "center",
  },
  temperature: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0478A7",
    marginBottom: 5,
  },
  weatherDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
    textTransform: "capitalize",
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  weatherDetail: {
    fontSize: 14,
    color: "#666",
  },
  wikiCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  wikiImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  wikiExtract: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 15,
    textAlign: "justify", // Added text justification for Wikipedia content
  },
  wikiButton: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  wikiButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  // Additional styles for remaining components
  recommendationsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  placeItem: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: "hidden",
  },
  selectedPlaceItem: {
    borderWidth: 3,
    borderColor: "#0478A7",
    backgroundColor: "#f0f9ff",
  },
  placeMainContent: {
    padding: 16,
    paddingBottom: 12,
  },
  placeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 26,
  },
  placeDetails: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    lineHeight: 18,
  },
  placeDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
    textAlign: "justify", // Added text justification
  },
  placeButtonRow: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton360: {
    backgroundColor: "#0478A7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionButtonInfo: {
    backgroundColor: "#17a2b8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // 360° Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#333",
    marginRight: 10,
  },
  closeButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f1f3f4",
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  viewTypeSelector: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  viewTypeSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  viewTypeButton: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 100,
    alignItems: "center",
  },
  activeViewTypeButton: {
    backgroundColor: "#0478A7",
  },
  viewTypeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeViewTypeButtonText: {
    color: "white",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
    zIndex: 1000,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  footerDescription: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    textAlign: "justify", // Added text justification
  },
  // Browser Modal Styles
  browserModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  browserHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0478A7",
    paddingTop: Platform.OS === "ios" ? 50 : 12,
  },
  browserBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  browserBackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  browserTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  browserContent: {
    flex: 1,
  },
  browserWebView: {
    flex: 1,
  },
  browserLoading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
    zIndex: 1000,
  },
  browserLoadingText: {
    marginTop: 10,
    color: "#0478A7",
    fontSize: 16,
    fontWeight: "600",
  },
  // Map Control Styles
  webMapControls: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 1000,
  },
  mobileMapControls: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 1000,
  },
  mapControlButton: {
    backgroundColor: "#0478A7",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  mapControlText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  disabledText: {
    color: "#999",
  },
  zoomLevelDisplay: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 5,
    alignItems: "center",
  },
  zoomLevelText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  resetButton: {
    backgroundColor: "#17a2b8",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  resetButtonText: {
    fontSize: 16,
  },
  zoomIndicator: {
    position: "absolute",
    bottom: 15,
    left: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  zoomIndicatorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});
