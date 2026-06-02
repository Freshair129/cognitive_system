{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "EVA-Episodic-Memory-v2-Sync",
    "description": "Synced version of the Episodic Memory Schema following the latest YAML spec (Map-based episodes, 9D Matrix, 5D Texture).",
    "type": "object",
    "required": [
        "persona_id",
        "develop_id",
        "user_id",
        "memory_version",
        "turn_id",
        "session_id",
        "timestamp",
        "episodes_structure"
    ],
    "properties": {
        "persona_id": {
            "type": "string"
        },
        "persona_name": {
            "type": "string"
        },
        "user_id": {
            "type": "string"
        },
        "memory_version": {
            "type": "string"
        },
        "develop_id": {
            "type": "string"
        },
        "session_id": {
            "type": "string"
        },
        "timestamp": {
            "type": "string",
            "format": "date-time"
        },
        "episodes_structure": {
            "type": "object",
            "additionalProperties": {
                "$ref": "#/definitions/episode"
            }
        }
    },
    "definitions": {
        "episode": {
            "type": "object",
            "required": [
                "episode_id",
                "episode_type",
                "situation_context",
                "turn_1",
                "turn_llm",
                "state_snapshot"
            ],
            "properties": {
                "episode_id": {
                    "type": "string"
                },
                "episode_type": {
                    "type": "string",
                    "enum": [
                        "interaction",
                        "synthesis",
                        "meta_cognition",
                        "system_event"
                    ]
                },
                "episode_tag": {
                    "type": "string"
                },
                "event_label": {
                    "type": "string"
                },
                "situation_context": {
                    "type": "object",
                    "required": [
                        "context_id",
                        "interaction_mode",
                        "stakes_level",
                        "time_pressure"
                    ],
                    "properties": {
                        "context_id": {
                            "type": "string"
                        },
                        "interaction_mode": {
                            "type": "string",
                            "enum": [
                                "small_talk",
                                "casual",
                                "deep_discussion",
                                "conflict",
                                "instruction",
                                "meta"
                            ]
                        },
                        "stakes_level": {
                            "type": "string",
                            "enum": [
                                "low",
                                "medium",
                                "high"
                            ]
                        },
                        "time_pressure": {
                            "type": "string",
                            "enum": [
                                "low",
                                "medium",
                                "high"
                            ]
                        }
                    }
                },
                "turn_1": {
                    "$ref": "#/definitions/turn_user"
                },
                "turn_llm": {
                    "$ref": "#/definitions/turn_llm"
                },
                "state_snapshot": {
                    "$ref": "State_Snapshot_Schema.json#"
                },
                "crosslinks": {
                    "type": "object",
                    "properties": {
                        "semantic_refs": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "sensory_refs": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "gks_refs": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "AQI_refs": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        },
        "turn_user": {
            "type": "object",
            "required": [
                "speaker"
            ],
            "properties": {
                "turn_id": {
                    "type": "string"
                },
                "speaker": {
                    "type": "string",
                    "enum": [
                        "user",
                        "system",
                        "unknown"
                    ]
                },
                "username": {
                    "type": "string",
                    "description": "Display name of speaker (e.g., THA-06, แอน)"
                },
                "user_id": {
                    "type": "string",
                    "description": "Registry ID (e.g., U_001) for speaker identification"
                },
                "source_type": {
                    "type": "string",
                    "description": "Primary = speaker's own experience, Secondary = story about others (to prevent LLM from adopting others' experiences as own)",
                    "enum": [
                        "Primary_Information",
                        "Secondary_Information"
                    ]
                },
                "raw_text": {
                    "type": "string"
                },
                "summary": {
                    "type": "string"
                },
                "affective_inference": {
                    "type": "object",
                    "properties": {
                        "intent": {
                            "type": "string"
                        },
                        "emotion_signal": {
                            "type": "string"
                        },
                        "intensity": {
                            "type": "number"
                        },
                        "confidence": {
                            "type": "number"
                        },
                        "slm_gut_vector": {
                            "type": "object",
                            "properties": {
                                "valence": {
                                    "type": "number"
                                },
                                "arousal": {
                                    "type": "number"
                                },
                                "stress": {
                                    "type": "number"
                                },
                                "warmth": {
                                    "type": "number"
                                }
                            }
                        }
                    }
                },
                "semantic_frames": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "salience_anchor": {
                    "type": "object",
                    "properties": {
                        "phrase": {
                            "type": "string"
                        },
                        "Resonance_impact": {
                            "type": "number"
                        }
                    }
                }
            }
        },
        "turn_llm": {
            "type": "object",
            "required": [
                "speaker"
            ],
            "properties": {
                "turn_id": {
                    "type": "string"
                },
                "speaker": {
                    "type": "string",
                    "enum": [
                        "llm",
                        "eva"
                    ]
                },
                "text_excerpt": {
                    "type": "string"
                },
                "summary": {
                    "type": "string"
                },
                "epistemic_mode": {
                    "type": "string",
                    "enum": [
                        "explore",
                        "hypothesize",
                        "assert",
                        "caution",
                        "reflect"
                    ]
                },
                "confidence": {
                    "type": "number"
                },
                "salience_anchor": {
                    "type": "object",
                    "properties": {
                        "phrase": {
                            "type": "string"
                        },
                        "Resonance_impact": {
                            "type": "number"
                        }
                    }
                },
                "stimulus_output": {
                    "$ref": "Stimulus_Output_Schema.json#"
                }
            }
        }
    }
}