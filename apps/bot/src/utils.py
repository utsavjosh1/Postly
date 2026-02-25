import discord
from typing import List, Dict, Any

class JobEmbedBuilder:
    @staticmethod
    def build_job_embed(job: Dict[str, Any]) -> discord.Embed:
        """
        Builds a discord.Embed for a single job.
        Ensures character limits are respected.
        """
        title = job.get("title", "Unknown Job Title")
        company = job.get("company_name", "Unknown Company")
        description = job.get("description", "No description provided.")
        location = job.get("location", "Remote" if job.get("remote") else "N/A")
        salary = f"{job.get('salary_min', '?')} - {job.get('salary_max', '?')}"
        source_url = job.get("source_url", "https://postly.app")

        # Truncate description to fit within Discord's 4096 limit
        # We'll use a safer limit like 1000 for better readability
        if len(description) > 1000:
            description = description[:997] + "..."

        embed = discord.Embed(
            title=f"🚀 {title}",
            description=description,
            url=source_url,
            color=discord.Color.blue()
        )

        embed.add_field(name="🏢 Company", value=company, inline=True)
        embed.add_field(name="📍 Location", value=location, inline=True)
        embed.add_field(name="💰 Salary", value=salary, inline=True)
        
        if job.get("job_type"):
            embed.add_field(name="🕒 Type", value=job["job_type"], inline=True)

        embed.set_footer(text="Powered by Postly | Daily Job Alerts")
        
        return embed

    @staticmethod
    def build_job_list_embed(jobs: List[Dict[str, Any]], page: int = 1, total_pages: int = 1) -> discord.Embed:
        """
        Builds a summary embed for multiple jobs.
        """
        embed = discord.Embed(
            title="📅 Daily Job Highlights",
            description=f"Here are the latest job matches for your server. (Page {page}/{total_pages})",
            color=discord.Color.green()
        )

        for job in jobs[:5]: # Show max 5 per embed for clarity
            title = job.get("title", "Job")
            company = job.get("company_name", "Company")
            url = job.get("source_url", "#")
            embed.add_field(
                name=f"{title} @ {company}",
                value=f"[View Job]({url})",
                inline=False
            )

        embed.set_footer(text="Type /setup to change notification settings.")
        return embed
