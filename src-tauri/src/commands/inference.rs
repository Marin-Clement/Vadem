use tauri::State;
use crate::services::ml_service::MlService;

#[derive(serde::Deserialize)]
pub struct InferenceInput {
    pub features: [f32; 24],
}

/// Runs the ONNX model and returns a win probability (0.0–1.0).
#[tauri::command]
pub fn predict_win(
    input: InferenceInput,
    ml: State<'_, MlService>,
) -> Result<f32, String> {
    ml.predict(input.features).map_err(|e| e.to_string())
}
