# Wildfire Occurrence Prediction Using Machine Learning Across India

*Technical documentation, methodology and experimental analysis behind the wildfire prediction system*

---

## Abstract

Wildfires are becoming a serious environmental and economic problem across India.

Rising temperatures, longer dry spells, tricky terrain, and very different types of vegetation from region to region all combine to make fire risk swing wildly depending on where and when you look.

Most existing systems only tell us about a fire after it’s already started (like satellite hotspot detection), but what forest departments actually need is something that can warn them in advance — ideally a day or more before ignition — so they can move resources and act preventively instead of just reacting.

In this paper, we build a machine learning model that tries to predict next-day wildfire occurrence across India.

To do this, we pulled together eight years (2018–2025) of data from multiple sources: fire detections from NASA FIRMS (VIIRS S-NPP, Collection 2), weather data from ERA5, vegetation health info from MODIS, and static terrain/land-cover data from SRTM and ESA WorldCover.

Altogether this gave us close to 9.4 million labeled data points across space and time.

Instead of randomly splitting the data, we trained only on 2018–2024 and tested purely on 2025 data the model had never seen — this is a much more honest test of how the model would actually perform in the real world.

We also used something we’re calling date-conditional negative sampling: basically, for every real fire event, we pick a "non-fire" example from the same date and same general weather conditions, so the model is forced to actually learn what separates f ire prone conditions from non-fire conditions, rather than just learning seasonal patterns.

We tried five different models — Logistic Regression, Random Forest, LightGBM, CatBoost, and XGBoost and compared them under this strict setup.

XGBoost came out on top, hitting 90.14% accuracy and 93.07% recall on actual fire events, clearly beating the linear baseline.

This shows that when you give a gradient-boosted model good physics-based features, it can genuinely tell fire-prone conditions apart from safe ones.

On top of the prediction model, we also added a SHAP-based explanation layer that turns feature importance scores into plain-language explanations, plus an interactive map dashboard so people can actually visualize daily risk without needing to be data scientists.

## Introduction

Roughly a quarter of India’s land is covered by forests and natural vegetation — these areas matter a lot, both as carbon sinks and as places millions of people depend on for their livelihoods.

Unfortunately, more and more of this land is getting hit by wildfires, driven by a mix of things: climate change, longer droughts, agricultural burning practices, and terrain that makes it hard to actually put fires out once they start.

Temperature and rainfall patterns in India are shifting —fire seasons are stretching longer, and monsoon changes are creating extended dry stretches where vegetation just dries out and becomes way more flammable.

Once a fire starts, it can spread incredibly fast, and the damage — biodiversity loss, degraded soil, carbon released into the atmosphere, risk to people’s homes, and messed-up watersheds is way bigger than the amount of time anyone actually has to contain it.

Basically, fires spread faster than we can respond, which is exactly why being able to predict fires before they happen matters so much.

1The real challenge in wildfire management isn’t detecting a fire once it’s already burning — satellite systems like NASA FIRMS already do that pretty well.

The hard part is anticipating: f iguring out, days ahead of time, which specific locations are most likely to catch fire given the current weather, how dry the vegetation is, and the shape of the terrain.

This is where machine learning comes in — it can learn the complicated, non-linear relationships between weather variables (temperature, humidity, wind, vapor pressure deficit), vegetation health (using EVI as a standin for how much moisture is in live vegetation), terrain factors (elevation, slope), and actual historical fire occurrence, all straight from satellite data.

This approach fits the problem well because fire ignition isn’t a smooth, gradual thing — it behaves more like a threshold: past a certain point, small shifts in weather can massively change how likely a fire is, and tree-based models are naturally good at picking up on these kinds of thresholds.

One big challenge with building a model like this is that fires are rare events.

On any given day, less than 0.1% of grid cells actually catch fire, which creates a huge class imbalance problem.

To deal with this properly, we use date-conditional negative sampling — we only pull "non-fire" training examples from locations that didn’t catch fire on the exact same date and under the same weather conditions as a real fire event elsewhere.

This forces the model to learn genuine f ire-vs-no-fire signals within the same season and weather regime, instead of just learning "oh, it’s summer, so fire risk is high everywhere." To summarize, this paper puts together: (1) a strict train/test split by time, so we’re testing on genuinely unseen future data (2025); (2) the date-conditional negative sampling method described above; (3)

feature engineering based on real fire science — weather, vegetation, and terrain features known to influence ignition; and (4) a comparison of five different classifiers to see how much value nonlinear models actually add over a simple baseline.

Our main contributions: • We built a large training dataset (9.4 million samples) combining NASA FIRMS fire data, ERA5 weather data, MODIS vegetation indices, and static terrain/land-cover info, spanning eight years (2018–2025).

This means every training example captures the full weather, vegetation, and terrain picture relevant to whether a fire starts.

• Wedesigned a date-conditional negative sampling method that matches non-fire examples to the same date and weather conditions as real fires, which helps deal with class imbalance and forces the model to learn actual fire-weather relationships instead of shortcuts.

• We compared five classifiers — Logistic Regression (a simple, interpretable baseline), Random Forest, LightGBM, CatBoost, and XGBoost — all trained and tested using the strict time-based split (train on 2018–2024, test on 2025).

This gives a much more realistic idea of how these models would perform if actually deployed.

• Webuilt an explanation layer using SHAP that turns model outputs into natural-language explanations, so the predictions are actually useful and understandable for forest management teams, not just data scientists.

• Webuilt an interactive map-based dashboard showing daily wildfire risk across India along with risk tiers, feature importance breakdowns, and rough fire spread direction based on wind and terrain.

The rest of the paper is organized as follows: Section 2 covers

## Related Work

on ML-based wildfire prediction.

Section 3 explains our

## Methodology

— data sources,

feature engineering, the negative sampling approach, model architecture, and overall workflow.

Section 4 covers our results and what we found.

Section 5 wraps up and talks about what we’d want to do next.

21 Materials and Methods 1.1 Data Description and Integration Strategy We combined five different

## Dataset

s, each chosen because it captures something scientifically important about what drives wildfires.

Table 1 lays out where each

dataset comes from, what time period and resolution it covers, and why we included it.

Data Source Variables ProCoverage Rationale vided NASA FIRMS (VIIRS S-NPP, C2) Active fire detections (confidence and radiative power) 20182025 Ground truth for fire occurrence and validation ERA5 Reanalysis 2m temperature, humidity, wind speed, vapor pressure deficit 20182025, 0.25×0.25 grid Physics-driven weather context; consistent interpolation across topographically complex terrain MODIS EVI Enhanced Vegetation Index (monthly composites) Live-fuel 20182025 proxy; moisture disentangles green vegetation from soil background SRTM / ESA WorldCover Elevation (m), terrain slope, land-cover class Static Terrain controls fire spread rate, fuel moisture retention, and vegetation composition Open-Meteo API 24h / 7-day weather forecasts (temperaReal-time Operational inference; enables next-day and ture, humidity, wind) weekly risk visualization Table 1: Data Sources and Scientific Integration Rationale 1.1.1 Fire Occurrence Ground Truth For actual fire occurrence data, we used NASA FIRMS’ VIIRS S-NPP Collection 2 active-fire product, covering 2018–2025.

VIIRS detects active fires globally roughly every 12 hours.

Each detection comes with a confidence score (nominal, probable, or high) and a measure of radiative power.

Following standard practice in fire monitoring, we only kept detections with at least "nominal" confidence, and we threw out cloudy days entirely — otherwise we’d risk mislabeling days as "no fire" just because clouds were blocking the satellite’s view, which would introduce false negatives into our training data.

1.1.2 Meteorological Reanalysis For weather data, we used ERA5, ECMWF’s global atmospheric reanalysis dataset.

For every grid cell and day, we pulled: 2m air temperature, 2m relative humidity, 10m wind speed, and vapor pressure deficit (VPD), which we calculated as the gap between saturated and actual vapor pressure.

We picked these specific variables because fire science research consistently links them to fire ignition — temperature affects how dry the fuel gets, humidity directly impacts fuel moisture, wind speed helps fires spread faster by increasing oxygen availability, and VPD is basically a more complete way of capturing how much water stress plants are under, making it arguably a better fire-weather signal than humidity alone.

31.1.3 Vegetation Health Indices To capture vegetation health, we used MODIS’s Enhanced Vegetation Index (EVI), pulled through NASA’s AppEEARS API.

We went with EVI instead of the more common NDVI because EVI is more sensitive to actual live-canopy greenness, corrects for atmospheric effects on its own, and isn’t as easily thrown off by bare soil in sparsely vegetated areas.

EVI values range from-1 to +1 — values near or above 0.3 generally mean healthy, actively growing vegetation, while values under 0.2 suggest sparse or stressed vegetation.

We used monthly EVI composites at 1km resolution from 2018–2025.

One tricky technical issue we ran into: MODIS composites are recorded on an 8-day rolling cycle, which doesn’t line up neatly with ERA5’s daily timestamps or regular calendar months.

To fix this, we built a custom time-alignment procedure (using cftime) that matches each MODIS timestamp to the nearest corresponding ERA5 date.

1.1.4 Static Topographic and Land-Cover Layers For elevation, we used the SRTM digital elevation model (30m resolution), averaged up to our 0.1° grid.

For land cover, we used ESA WorldCover (10m resolution, 2021 snapshot), which sorts land into 11 standard categories like forest, grassland, cropland, built-up areas, water, etc.

1.1.5 Data Integration and Preprocessing Once everything was downloaded and cleaned, we merged all the layers into a single geospatial database, aligned to a common 0.1° grid covering all of India.

We picked this resolution as a balance — fine enough to actually capture meaningful local differences in fire risk but coarse enough that training on 9.4 million samples doesn’t require anything beyond normal computing hardware.

For each grid cell and date, we did the following: (1) checked FIRMS for whether a fire occurred that day, (2) pulled ERA5 weather variables via interpolation, (3) aligned and aggregated MODIS EVI data, (4) grabbed static elevation and land-cover values, (5) ran quality control checks, and (6) built the final feature vector for that cell-day.

This whole process gave us 9.4 million labeled cell-day records across eight years.

1.2

## Feature Engineering

and Physics-Informed Design We engineered 15 features total, grouped into four categories based on the underlying fire science.

1.2.1 Temporal Features To help the model understand seasonal patterns without creating weird artificial jumps, we encoded the calendar month using a sine-cosine (cyclical) transformation instead of just using raw month numbers.

The problem with raw numbers is that a model would see January (1) and December (12) as being about as far apart as possible, even though they’re actually right next to each other in terms of season.

The cyclical encoding fixes this: Month_sin = sin 2π ·Month 12 Month_cos = cos 2π ·Month 12 (1) (2) This way, December and January end up close together in feature space, matching how they’re actually adjacent in the fire season calendar.

This lets the gradient-boosted models pick up on seasonal fire patterns naturally, without needing separate rules for each individual month.
