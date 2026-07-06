# I. ABSTRACT

Wildfires are becoming a serious environmental and economic problem across India. Rising temperatures, longer dry spells, tricky terrain, and very different types of vegetation from region to region all combine to make fire risk swing wildly depending on where and when you look.

Most existing systems only tell us about a fire after it's already started (like satellite hotspot detection), but what forest departments actually need is something that can warn them in advance — ideally a day or more before ignition — so they can move resources and act preventively instead of just reacting.

In this paper, we build a machine learning model that tries to predict next-day wildfire occurrence across India. To do this, we pulled together eight years (2018–2025) of data from multiple sources: fire detections from **NASA FIRMS** (VIIRS S-NPP, Collection 2), weather data from **ERA5**, vegetation health info from **MODIS**, and static terrain/land-cover data from SRTM and ESA WorldCover.

Altogether this gave us close to 9.4 million labeled data points across space and time. Instead of randomly splitting the data, we trained only on 2018–2024 and tested purely on 2025 data the model had never seen — this is a much more honest test of how the model would actually perform in the real world.

We also used something we're calling date-conditional negative sampling: basically, for every real fire event, we pick a "non-fire" example from the same date and same general weather conditions, so the model is forced to actually learn what separates fire-prone conditions from non-fire conditions, rather than just learning seasonal patterns.

We tried five different models — Logistic Regression, Random Forest, LightGBM, CatBoost, and XGBoost — and compared them under this strict setup. XGBoost came out on top, hitting 90.14% accuracy and 93.07% recall on actual fire events, clearly beating the linear baseline. This shows that when you give a gradient-boosted model good physics-based features, it can genuinely tell fire-prone conditions apart from safe ones.

On top of the prediction model, we also added a SHAP-based explanation layer that turns feature importance scores into plain-language explanations, plus an interactive map dashboard so people can actually visualize daily risk without needing to be data scientists.

**Keywords** — Wildfire Prediction, Machine Learning, XGBoost, NASA FIRMS, SHAP Explainability, India, Remote Sensing, Gradient Boosting

---

## II. INTRODUCTION

Roughly a quarter of India's land is covered by forests and natural vegetation — these areas matter a lot, both as carbon sinks and as places millions of people depend on for their livelihoods.

Unfortunately, more and more of this land is getting hit by wildfires, driven by a mix of things: climate change, longer droughts, agricultural burning practices, and terrain that makes it hard to actually put fires out once they start.

Existing fire detection systems, like NASA's FIRMS (Fire Information for Resource Management System), can tell us where fires are actively burning, but that's reactive — the damage is already happening. What's needed is a system that can predict where fires are likely to occur before ignition, giving forest departments and disaster management teams time to position resources and take preventive action.

India's geographic diversity makes this particularly challenging. The dry deciduous forests of central India, the humid Western Ghats, the alpine ecosystems of the Himalayas, and the grasslands of the Northeast all have completely different fire regimes, fuel types, and seasonal patterns. A single statistical model that works everywhere is a hard problem.

## III. RELATED WORK

Fire prediction has been studied using both physical models and data-driven approaches. Physical models like the Canadian Forest Fire Weather Index (FWI) and the U.S. National Fire Danger Rating System (NFDRS) use weather variables and fuel moisture codes to estimate fire danger. These work well in the regions they were designed for, but they don't transfer well to India's diverse ecosystems without significant recalibration.

On the machine learning side, researchers have applied Random Forests, Support Vector Machines, and neural networks to fire prediction with varying success. Most prior work uses random train-test splits, which can give overly optimistic results because fires are strongly seasonal — a model that learns seasonal patterns can look good on a random split without actually understanding fire dynamics.

Relatively few studies have tackled India specifically. The ones that do typically focus on a single state or forest type. We believe this is the first attempt to build a single model that works across the entire Indian landmass.

## IV. METHODOLOGY

Our approach has three main components:

1. **Data Integration**: We combine fire occurrence labels with weather, vegetation, and terrain data to create a comprehensive feature set for every 0.1° grid cell across India for every day from 2018 to 2025.

2. **Model Training**: We train multiple gradient boosting models using a temporal split (train on 2018–2024, test on 2025) with date-conditional negative sampling to prevent the model from learning seasonal shortcuts.

3. **Deployment**: The trained model is served via a FastAPI backend and integrated with an interactive Leaflet-based dashboard that shows daily fire risk predictions as a heatmap overlay on OpenStreetMap.

## V. DATASET

### Data Sources

| Source | Variables | Resolution | Period |
|--------|-----------|------------|--------|
| NASA FIRMS VIIRS | Fire detections (binary) | 375m | 2018–2025 |
| ERA5 Reanalysis | Temperature, humidity, wind, VPD | 0.25° | 2018–2025 |
| MODIS MOD13A3 | EVI (vegetation index) | 1km monthly | 2018–2025 |
| SRTM | Elevation | 30m | Static |
| ESA WorldCover | Land cover (11 classes) | 10m | 2020 |

### Target Variable

The target variable is binary: whether a fire was detected in a given grid cell on a given day. A grid cell is labeled positive if at least one VIIRS fire detection with confidence ≥ "nominal" falls within its boundaries.

### Negative Sampling Strategy

Instead of using all non-fire examples (which would create massive class imbalance), we use date-conditional negative sampling. For each positive example on a given date, we randomly sample a negative example from the same date at a location with similar weather conditions but no fire detection.

## VI. FEATURE ENGINEERING

We engineered 21 features spanning four categories:

**Weather Features** (4): Temperature (°C), relative humidity (%), wind speed (m/s), and vapor pressure deficit (VPD in kPa). VPD is computed from temperature and humidity and measures the atmospheric demand for moisture.

**Temporal Features** (2): Month encoded as sin and cos to capture seasonal cyclicality without losing the circular nature of months.

**Vegetation Features** (2): Enhanced Vegetation Index (EVI) as a measure of vegetation health and greenness, plus a VPD × Wind interaction term that captures the combined drying and oxygen-supplying effect.

**Static Features** (13): Elevation from SRTM and 11 land cover proportions from ESA WorldCover (tree cover, shrubland, grassland, cropland, built-up, sparse vegetation, snow/ice, permanent water, herbaceous wetland, mangroves, moss/lichen).

## VII. MODEL ARCHITECTURE

We selected XGBoost (eXtreme Gradient Boosting) as our final model after comparing it against four alternatives:

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
|-------|----------|-----------|--------|----------|---------|
| XGBoost | 90.14% | 85.95% | 96.07% | 90.73% | 96.11% |
| LightGBM | 90.01% | 88.01% | 92.74% | 90.31% | 95.85% |
| CatBoost | 89.76% | 87.44% | 92.96% | 90.12% | 95.60% |
| Random Forest | 89.08% | 90.28% | 87.69% | 88.97% | 95.84% |
| Logistic Regression | 82.58% | 80.36% | 86.45% | 83.29% | 89.68% |

XGBoost hyperparameters: 100 estimators, max depth 5, learning rate 0.1, subsample 0.8, colsample_bytree 0.8, eval_metric logloss.

## VIII. TRAINING PROCEDURE

**Temporal Split**: Training on 2018–2024 data (7 years), testing exclusively on 2025 data (1 year). This is stricter than random splitting because the model must generalize to weather patterns and fire regimes it has never seen.

**Cross-Validation**: 5-fold stratified cross-validation within the training set for hyperparameter tuning.

**Class Imbalance**: Date-conditional negative sampling produces approximately balanced training batches. We also experimented with SMOTE oversampling and class weights; the sampling approach gave the best results.

**Hardware**: Training was performed on a standard workstation with 16GB RAM and an 8-core CPU. Training time for XGBoost on the full dataset was approximately 45 minutes.

## IX. EXPERIMENTAL RESULTS

XGBoost achieved the highest overall performance with ROC-AUC of 96.11% and recall of 96.07%. The high recall is particularly important for a wildfire early warning system — false negatives (missed fires) are far more costly than false positives.

### Feature Importance

The top contributing features by SHAP importance were:

1. **VPD** (22.1%) — Atmospheric demand for moisture is the single strongest predictor
2. **Temperature** (18.3%) — Higher temperatures drive evaporation and fuel drying
3. **Humidity** (15.7%) — Low humidity directly correlates with fire ignition probability
4. **Wind Speed** (11.8%) — Wind spreads fire and supplies oxygen
5. **EVI** (9.5%) — Vegetation health indicates fuel availability
6. **VPD × Wind** (7.6%) — Interaction term captures compound drying effects

### Geographic Performance

The model performs consistently across all Indian forest regions. Performance is strongest in central India's dry deciduous forests (where fire patterns are most regular) and weakest in the humid Western Ghats (where fires are rarer and more stochastic).

## X. EVALUATION

### Metrics

| Metric | Value |
|--------|-------|
| ROC-AUC | 0.9611 |
| Accuracy | 0.9014 |
| Precision | 0.8595 |
| Recall | 0.9607 |
| F1 Score | 0.9073 |
| Brier Score | 0.0388 |

### Calibration

The model's predicted probabilities are well-calibrated (Brier Score 0.0388), meaning the probability scores can be interpreted directly as fire risk percentages. This is important for the dashboard, where users see risk displayed as a percentage.

## XI. EXPLAINABILITY

We use SHAP (SHapley Additive exPlanations) to explain individual predictions. For any location in India, the system can show exactly which features contributed most to the fire risk estimate — and in which direction.

For example, a high-risk prediction in central India during April might show:
- VPD: +15% (increased risk due to high atmospheric demand)
- Temperature: +12% (elevated temperatures)
- Humidity: +8% (low moisture)
- EVI: -3% (healthy vegetation slightly reduces risk)

This transparency is crucial for building trust with forest department users who need to understand why the system is flagging certain areas.

## XII. LIMITATIONS

Several limitations should be acknowledged:

1. **Resolution**: The 0.1° grid (~11km) is coarse relative to the scale at which fires actually spread. Sub-grid processes like local wind patterns and micro-topography are not captured.

2. **Anthropogenic Factors**: The model does not account for human-caused ignitions (agricultural burning, campfires, arson), which are the primary cause of wildfires in many parts of India.

3. **Data Gaps**: The land cover data is from 2020 and does not capture recent land-use changes. MODIS EVI has gaps during heavy monsoon cloud cover.

4. **Temporal Scope**: Trained on 7 years of data, the model may not capture multi-decadal climate trends or rare extreme events.

5. **Island Territories**: Andaman & Nicobar and Lakshadweep are not included in the current prediction grid.

## XIII. FUTURE WORK

Several directions for improvement are planned:

1. **Higher Resolution**: Moving to 0.05° or finer grid resolution to better capture local fire dynamics.
2. **Real-time Weather**: Integrating live weather station data and short-term forecasts instead of reanalysis.
3. **Fire Spread Modeling**: Adding a spread simulation component that predicts fire movement after ignition.
4. **Ensemble Forecasting**: Running the model with multiple weather forecast scenarios to produce probabilistic risk ranges.
5. **Mobile Deployment**: Optimizing the model for edge deployment on mobile devices for field use by forest rangers.

## XIV. CONCLUSION

We presented a machine learning system for predicting next-day wildfire occurrence across India using XGBoost trained on 9.4 million data points spanning 2018–2025. The model achieves 96.11% ROC-AUC and 96.07% recall under a strict temporal validation scheme, demonstrating that gradient-boosted models with physics-based features can effectively distinguish fire-prone conditions from safe ones.

The system is deployed as a production dashboard with an interactive map, daily risk heatmaps, NASA FIRMS active fire overlays, and SHAP-based explanations — making advanced wildfire prediction accessible to forest managers, researchers, and policymakers.

---

## REFERENCES

[1] Giglio, L., Schroeder, W., & Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and fire products. *Remote Sensing of Environment*, 178, 31–41.

[2] Hersbach, H., et al. (2020). The ERA5 global reanalysis. *Quarterly Journal of the Royal Meteorological Society*, 146(730), 1999–2049.

[3] Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD*, 785–794.

[4] Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems*, 30.

[5] Van Wagner, C. E. (1987). Development and structure of the Canadian Forest Fire Weather Index System. *Canadian Forestry Service*, Technical Report 35.

[6] Jain, P., et al. (2020). A review of machine learning applications in wildfire science and management. *Environmental Reviews*, 28(4), 478–505.

[7] Didan, K. (2015). MOD13A3 MODIS/Terra vegetation indices monthly L3 global 1km SIN grid. *NASA LP DAAC*.

[8] Zanaga, D., et al. (2021). ESA WorldCover 10m 2020 v100. *Zenodo*.

[9] Farr, T. G., et al. (2007). The Shuttle Radar Topography Mission. *Reviews of Geophysics*, 45(2).

[10] Ke, G., et al. (2017). LightGBM: A highly efficient gradient boosting decision tree. *Advances in Neural Information Processing Systems*, 30.
