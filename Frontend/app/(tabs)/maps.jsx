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

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (visible && place) {
      fetchPlaceInformation();
    }
  }, [visible, place]);

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
    }, 300);

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
      return getDemoPhotos();
    } catch (error) {
      console.error("Error fetching photos:", error);
      return getDemoPhotos();
    } finally {
      setPhotosLoading(false);
    }
  };

  const getDemoPhotos = () => {
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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search photos..."
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

// FIXED: Enhanced In-App 360° Modal Component
const InApp360Modal = ({ place, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  // Add after: const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(false);

  const sriLanka360URL =
    "https://www.360cities.net/area/sri-lanka?embed=true&autoplay=true&hideui=true";

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      setHasLoaded(false);
    } else {
      setLoading(false);
      setError(null);
      setHasLoaded(false);
    }
  }, [visible]);

  const handleWebViewLoadStart = () => {
    if (!hasLoaded) {
      setLoading(true);
      setError(null);
    }
  };

  const handleWebViewLoadEnd = () => {
    setLoading(false);
    setHasLoaded(true);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
    setLoading(false);
    setError(
      "Failed to load 360° panorama. Please check your internet connection."
    );
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setHasLoaded(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const WebContent = () => {
    if (Platform.OS === "web") {
      return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {loading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #0478A7",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    animation: "spin 2s linear infinite",
                    margin: "0 auto",
                  }}
                ></div>
              </div>
              <div style={{ color: "#0478A7", fontWeight: "600" }}>
                Loading 360° Experience...
              </div>
            </div>
          )}
          <iframe
            src={sriLanka360URL}
            style={{
              width: "100%",
              height: "450px",
              border: "none",
              borderRadius: "12px",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              setLoading(false);
              setHasLoaded(true);
            }}
            onError={() => {
              setLoading(false);
              setError("Failed to load 360° panorama");
            }}
          />
        </div>
      );
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ uri: sriLanka360URL }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        scalesPageToFit={true}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onError={handleWebViewError}
        onHttpError={handleWebViewError}
        renderLoading={() => null}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        originWhitelist={["*"]}
        cacheEnabled={true}
      />
    );
  };

  // Add these functions before const WebContent = () => {
  const handleZoomIn = () => {
    if (zoomLevel < 3) {
      const newZoom = zoomLevel + 0.2;
      setZoomLevel(newZoom);
      setCanZoomOut(true);
      if (newZoom >= 3) setCanZoomIn(false);

      if (webViewRef.current && Platform.OS !== "web") {
        webViewRef.current.injectJavaScript(`
        document.body.style.transform = 'scale(${newZoom})';
        document.body.style.transformOrigin = 'center center';
        true;
      `);
      }
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      const newZoom = zoomLevel - 0.2;
      setZoomLevel(newZoom);
      setCanZoomIn(true);
      if (newZoom <= 0.5) setCanZoomOut(false);

      if (webViewRef.current && Platform.OS !== "web") {
        webViewRef.current.injectJavaScript(`
        document.body.style.transform = 'scale(${newZoom})';
        document.body.style.transformOrigin = 'center center';
        true;
      `);
      }
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setCanZoomIn(true);
    setCanZoomOut(false);

    if (webViewRef.current && Platform.OS !== "web") {
      webViewRef.current.injectJavaScript(`
      document.body.style.transform = 'scale(1)';
      true;
    `);
    }
  };

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
            🌍 Explore Sri Lanka in 360°
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {loading && !hasLoaded && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#0478A7" />
                  <Text style={styles.loadingText}>
                    Loading 360° Experience...
                  </Text>
                </View>
              )}
              <WebContent />
            </>
          )}
        </View>
        // Add after{" "}
      </View>{" "}
      of contentContainer and before{" "}
      <View style={styles.modalFooter}>
        <View style={styles.panoramaControls}>
          <TouchableOpacity
            style={[styles.zoomButton, !canZoomIn && styles.disabledZoomButton]}
            onPress={handleZoomIn}
            disabled={!canZoomIn}
          >
            <Text
              style={[
                styles.zoomButtonText,
                !canZoomIn && styles.disabledZoomText,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>

          <View style={styles.zoomLevelIndicator}>
            <Text style={styles.zoomLevelText}>
              {Math.round(zoomLevel * 100)}%
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.zoomButton,
              !canZoomOut && styles.disabledZoomButton,
            ]}
            onPress={handleZoomOut}
            disabled={!canZoomOut}
          >
            <Text
              style={[
                styles.zoomButtonText,
                !canZoomOut && styles.disabledZoomText,
              ]}
            >
              −
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetZoomButton} onPress={resetZoom}>
            <Text style={styles.resetZoomText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalFooter}>
          <Text style={styles.footerText}>
            🌍 Immersive 360° panoramic views of Sri Lanka
          </Text>
          <Text style={styles.footerDescription}>
            Explore the beautiful landscapes, heritage sites, and stunning
            locations across the Pearl of the Indian Ocean in full 360° view.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// FIXED: Enhanced In-App 360Cities Browser Component
const InApp360CitiesBrowser = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  const sriLanka360CitiesURL =
    "https://www.360cities.net/area/sri-lanka?embed=true&hideui=true";

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      setHasLoaded(false);
    } else {
      setLoading(false);
      setError(null);
      setHasLoaded(false);
    }
  }, [visible]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setHasLoaded(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleWebViewLoadStart = () => {
    if (!hasLoaded) {
      setLoading(true);
      setError(null);
    }
  };

  const handleWebViewLoadEnd = () => {
    setLoading(false);
    setHasLoaded(true);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("360Cities WebView error:", nativeEvent);
    setLoading(false);
    setError(
      "Failed to load 360Cities panorama. Please check your internet connection."
    );
  };

  const WebBrowserContent = () => {
    if (Platform.OS === "web") {
      return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {loading && !hasLoaded && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #0478A7",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    animation: "spin 2s linear infinite",
                    margin: "0 auto",
                  }}
                ></div>
              </div>
              <div style={{ color: "#0478A7", fontWeight: "600" }}>
                Loading 360Cities...
              </div>
            </div>
          )}
          <iframe
            src={sriLanka360CitiesURL}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: "12px",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              setLoading(false);
              setHasLoaded(true);
            }}
            onError={() => {
              setLoading(false);
              setError("Failed to load 360Cities panorama");
            }}
          />
        </div>
      );
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ uri: sriLanka360CitiesURL }}
        style={styles.browserWebView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        scalesPageToFit={true}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onError={handleWebViewError}
        onHttpError={handleWebViewError}
        renderLoading={() => null}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        originWhitelist={["*"]}
        cacheEnabled={true}
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
          <View style={styles.browserHeaderSpacer} />
        </View>
        <View style={styles.browserContent}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {loading && !hasLoaded && (
                <View style={styles.browserLoading}>
                  <ActivityIndicator size="large" color="#0478A7" />
                  <Text style={styles.browserLoadingText}>
                    Loading 360Cities...
                  </Text>
                </View>
              )}
              <WebBrowserContent />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// FIXED: Enhanced Web Map Component
const WebMap = ({ places, selectedPlace, onSelectPlace }) => {
  if (Platform.OS !== "web") return null;

  const mapContainerRef = React.useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [currentBounds, setCurrentBounds] = useState(null);

  React.useEffect(() => {
    if (
      mapContainerRef.current &&
      typeof document !== "undefined" &&
      !mapInitialized
    ) {
      initializeMap();
      setMapInitialized(true);
    }
  }, []);

  React.useEffect(() => {
    if (
      mapInitialized &&
      selectedPlace &&
      selectedPlace.latitude &&
      selectedPlace.longitude
    ) {
      updateMapForSelectedPlace();
    }
  }, [selectedPlace, mapInitialized]);

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "10px";
    iframe.title = "Sri Lanka Map";

    const defaultBounds = {
      minLng: 79.5,
      minLat: 5.9,
      maxLng: 81.9,
      maxLat: 9.9,
    };

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${defaultBounds.minLng},${defaultBounds.minLat},${defaultBounds.maxLng},${defaultBounds.maxLat}&layer=mapnik`;
    iframe.src = mapUrl;

    mapContainerRef.current.innerHTML = "";
    mapContainerRef.current.appendChild(iframe);
    setCurrentBounds(defaultBounds);
  };

  const updateMapForSelectedPlace = () => {
    if (!mapContainerRef.current || !selectedPlace) return;

    const lat = parseFloat(selectedPlace.latitude);
    const lng = parseFloat(selectedPlace.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const delta = 0.2;
    const newBounds = {
      minLng: lng - delta,
      minLat: lat - delta,
      maxLng: lng + delta,
      maxLat: lat + delta,
    };

    if (
      !currentBounds ||
      Math.abs(currentBounds.minLng - newBounds.minLng) > 0.01 ||
      Math.abs(currentBounds.minLat - newBounds.minLat) > 0.01
    ) {
      const iframe = mapContainerRef.current.querySelector("iframe");
      if (iframe) {
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${newBounds.minLng},${newBounds.minLat},${newBounds.maxLng},${newBounds.maxLat}&layer=mapnik&marker=${lat},${lng}`;
        iframe.src = mapUrl;
        setCurrentBounds(newBounds);
      }
    }
  };

  const handleResetView = () => {
    if (mapInitialized) {
      setMapInitialized(false);
      setTimeout(() => {
        initializeMap();
        setMapInitialized(true);
      }, 100);
    }
  };

  return (
    <View style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      <View style={styles.webMapControls}>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetView}>
          <Text style={styles.resetButtonText}>🏠</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// FIXED: Enhanced Mobile Map Component
const MobileMap = ({ places, selectedPlace, onSelectPlace }) => {
  if (Platform.OS === "web") return null;

  const mapRef = useRef(null);
  const [currentRegion, setCurrentRegion] = useState(SRI_LANKA_CENTER);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current && mapReady) {
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
  }, [mapReady]);

  useEffect(() => {
    if (
      selectedPlace &&
      selectedPlace.latitude &&
      selectedPlace.longitude &&
      mapReady
    ) {
      const lat = parseFloat(selectedPlace.latitude);
      const lng = parseFloat(selectedPlace.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        };

        const shouldAnimate =
          !currentRegion ||
          Math.abs(currentRegion.latitude - lat) > 0.1 ||
          Math.abs(currentRegion.longitude - lng) > 0.1;

        if (shouldAnimate) {
          setCurrentRegion(newRegion);
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }
      }
    }
  }, [selectedPlace, mapReady]);

  const handleMapReady = () => {
    setMapReady(true);
  };

  const handleZoomIn = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.max(currentRegion.latitudeDelta * 0.5, 0.01),
      longitudeDelta: Math.max(currentRegion.longitudeDelta * 0.5, 0.01),
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
        onMapReady={handleMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
        zoomEnabled={true}
        scrollEnabled={true}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#0478A7"
        loadingBackgroundColor="#f9f9f9"
      >
        {places.map((place, index) => {
          if (place.latitude && place.longitude) {
            const lat = parseFloat(place.latitude);
            const lng = parseFloat(place.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={`${place.name}-${index}`}
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
    textAlign: "justify",
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
  infoPlaceDescription: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    textAlign: "justify",
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
    paddingHorizontal: 4,
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
  photosLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  photosLoadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
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
    textAlign: "justify",
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
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
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
    textAlign: "justify",
  },
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
  browserHeaderSpacer: {
    width: 60,
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
  panoramaControls: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 1000,
  },
  zoomButton: {
    backgroundColor: "#0478A7",
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  disabledZoomButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  zoomButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  disabledZoomText: {
    color: "#999",
  },
  zoomLevelIndicator: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  zoomLevelText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  resetZoomButton: {
    backgroundColor: "#17a2b8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  resetZoomText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
