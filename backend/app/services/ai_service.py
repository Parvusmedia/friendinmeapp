import json
import logging
from typing import Any

import httpx

from app.config import get_settings
from app.models.dog import Dog
from app.services.match_engine import MatchComputation

logger = logging.getLogger(__name__)


class AIService:
    """OpenAI-backed copy with strict no-invention rules; falls back to templates."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def _dog_facts_dict(self, dog: Dog) -> dict[str, Any]:
        return {
            "name": dog.name,
            "age_estimate": dog.age_estimate,
            "size": dog.size.value,
            "sex": dog.sex.value,
            "province": dog.province,
            "city": dog.city,
            "energy_level": dog.energy_level.value,
            "sociability_with_dogs": dog.sociability_with_dogs.value,
            "sociability_with_cats": dog.sociability_with_cats.value,
            "good_with_children": dog.good_with_children.value,
            "can_live_in_apartment": dog.can_live_in_apartment.value,
            "needs_experience": dog.needs_experience.value,
            "can_be_alone_hours": dog.can_be_alone_hours.value,
            "medical_needs": dog.medical_needs or None,
            "behaviour_notes": dog.behaviour_notes or None,
            "story": dog.story or None,
            "ideal_home": dog.ideal_home or None,
        }

    async def generate_dog_summary(self, dog: Dog) -> str:
        facts = self._dog_facts_dict(dog)
        if not self.settings.openai_api_key:
            return self._fallback_dog_summary(dog)

        system = (
            "Eres un asistente para refugios de animales. Redactas textos claros y empáticos en español. "
            "REGLAS: No inventes datos que no aparezcan en el JSON. No hagas afirmaciones veterinarias. "
            "No prometas adopciones. Si un campo es null o vacío, no lo menciones como hecho. "
            "Usa tono cálido y profesional, máximo 3 párrafos cortos."
        )
        user = f"Datos verificados del perro (JSON):\n{json.dumps(facts, ensure_ascii=False)}"
        text = await self._openai_chat(system, user)
        return text or self._fallback_dog_summary(dog)

    async def explain_match(self, dog: Dog, match: MatchComputation) -> str:
        if not self.settings.openai_api_key:
            return self._fallback_match_explanation(dog, match)

        facts = self._dog_facts_dict(dog)
        payload = {
            "dog": facts,
            "compatibility_score": match.compatibility_score,
            "match_level": match.match_level.value,
            "reasons": match.reasons,
            "warnings": match.warnings,
        }
        system = (
            "Eres un asistente de adopción responsable. Explicas compatibilidad en español de forma breve (máx. 4 frases). "
            "REGLAS ESTRICTAS: No inventes datos del perro ni del adoptante. Solo usa el JSON y las listas reasons/warnings. "
            "Los mensajes que empiezan por «No consta» o indican información pendiente están SOLO en warnings: "
            "no los presentes como puntos a favor. Si hay warnings de datos sin confirmar, la puntuación es provisional. "
            "No garantices adopción ni compatibilidad absoluta. No des consejo veterinario. "
            "Prioriza bienestar animal y honestidad."
        )
        user = f"Contexto del match (JSON):\n{json.dumps(payload, ensure_ascii=False)}"
        text = await self._openai_chat(system, user)
        return text or self._fallback_match_explanation(dog, match)

    def _fallback_dog_summary(self, dog: Dog) -> str:
        parts = [
            f"{dog.name} es un perro de tamaño {dog.size.value}, con energía {dog.energy_level.value}. "
            f"Se ubica en {dog.city}, {dog.province}."
        ]
        if dog.story:
            parts.append(dog.story[:400] + ("…" if len(dog.story) > 400 else ""))
        elif dog.behaviour_notes:
            parts.append(dog.behaviour_notes[:400] + ("…" if len(dog.behaviour_notes) > 400 else ""))
        parts.append(
            "Este resumen es automático sin IA: revisa la ficha completa y consulta al refugio para cualquier duda."
        )
        return "\n\n".join(parts)

    def _fallback_match_explanation(self, dog: Dog, match: MatchComputation) -> str:
        level_es = {
            "excellent": "muy favorable",
            "good": "favorable",
            "possible": "moderada",
            "risky": "baja o con riesgos importantes",
        }.get(match.match_level.value, match.match_level.value)
        intro = (
            f"Compatibilidad orientativa con {dog.name}: puntuación {match.compatibility_score}/100 "
            f"({level_es}). Es una guía, no una garantía."
        )
        gap_warnings = [w for w in match.warnings if w.lower().startswith("no consta") or "pendiente" in w.lower()]
        other_warnings = [w for w in match.warnings if w not in gap_warnings]
        if gap_warnings:
            wtext = " Información por confirmar con el refugio: " + " ".join(gap_warnings[:3])
        elif other_warnings:
            wtext = " Atención: " + " ".join(other_warnings[:2])
        else:
            wtext = ""
        r = " ".join(match.reasons[:2]) if match.reasons else ""
        return intro + wtext + (" " + r if r else "") + " Habla siempre con el refugio antes de decidir."

    async def _openai_chat(self, system: str, user: str) -> str | None:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.settings.openai_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.4,
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenAI request failed: %s", exc)
            return None
