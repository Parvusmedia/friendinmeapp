import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def send_lead_notification(
        self,
        *,
        to_emails: list[str],
        subject: str,
        body: str,
    ) -> None:
        if not to_emails:
            return
        if not self.settings.smtp_host:
            logger.info("SMTP not configured; would email %s: %s", to_emails, body[:500])
            return

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.settings.mail_from
        msg["To"] = ", ".join(to_emails)
        msg.set_content(body)

        try:
            if self.settings.smtp_tls:
                with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as smtp:
                    smtp.starttls()
                    if self.settings.smtp_user:
                        smtp.login(self.settings.smtp_user, self.settings.smtp_password)
                    smtp.send_message(msg)
            else:
                with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as smtp:
                    if self.settings.smtp_user:
                        smtp.login(self.settings.smtp_user, self.settings.smtp_password)
                    smtp.send_message(msg)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to send email: %s", exc)

    def send_adopter_results_link(self, *, to_email: str, results_url: str) -> bool:
        subject = "Tus resultados de compatibilidad — FriendInMe"
        body = (
            "Hola,\n\n"
            "Aquí tienes el enlace para ver tus matches de adopción en FriendInMe:\n\n"
            f"{results_url}\n\n"
            "Si no solicitaste este correo, puedes ignorarlo.\n\n"
            "— FriendInMe\n"
        )
        if not self.settings.smtp_host:
            logger.info("SMTP not configured; results link for %s: %s", to_email, results_url)
            return False
        self.send_lead_notification(to_emails=[to_email], subject=subject, body=body)
        return True
