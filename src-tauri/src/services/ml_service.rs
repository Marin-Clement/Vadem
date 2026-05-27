use anyhow::{anyhow, Result};
use ort::session::{builder::GraphOptimizationLevel, Session};
use ort::value::Value;
use std::sync::Mutex;

pub struct MlService {
    // Mutex because Session::run requires &mut self in ort rc.12
    session: Mutex<Session>,
}

impl MlService {
    pub fn load(model_path: &str) -> Result<Self> {
        let session = Session::builder()
            .map_err(|e| anyhow!("{e}"))?
            .with_optimization_level(GraphOptimizationLevel::Level3)
            .map_err(|e| anyhow!("{e}"))?
            .commit_from_file(model_path)
            .map_err(|e| anyhow!("{e}"))?;

        Ok(Self {
            session: Mutex::new(session),
        })
    }

    /// Takes a 24-element feature vector and returns the win probability (0.0–1.0).
    ///
    /// Feature order (must match training pipeline):
    ///  [0]  ally_kills   [1]  enemy_kills  [2]  ally_deaths  [3]  enemy_deaths
    ///  [4]  ally_cs      [5]  enemy_cs     [6]  ally_gold    [7]  enemy_gold
    ///  [8]  ally_xp      [9]  enemy_xp     [10] game_time
    ///  [11..23] per-role level diffs + objective flags
    pub fn predict(&self, features: [f32; 24]) -> Result<f32> {
        // Model input name is "float_input" (from skl2onnx initial_type)
        let input_value =
            Value::from_array(([1usize, 24], features.to_vec())).map_err(|e| anyhow!("{e}"))?;

        let mut session = self.session.lock().unwrap();
        let outputs = session
            .run(ort::inputs!["float_input" => input_value])
            .map_err(|e| anyhow!("{e}"))?;

        // Output "lgbmprobabilities": float32 [1, 2]
        // Stripped of ZipMap — data[0] = P(loss), data[1] = P(win)
        let (_, data) = outputs["lgbmprobabilities"]
            .try_extract_tensor::<f32>()
            .map_err(|e| anyhow!("{e}"))?;

        let win_prob = *data
            .get(1)
            .ok_or_else(|| anyhow!("probabilities tensor has fewer than 2 elements"))?;
        Ok(win_prob)
    }
}

// Safe: MlService is only accessed through &self (predict locks the inner Mutex).
unsafe impl Send for MlService {}
unsafe impl Sync for MlService {}
