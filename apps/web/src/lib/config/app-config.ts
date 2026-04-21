export class AppConfig {
  public readonly backendBaseUrl: string;

  public constructor() {
    this.backendBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
      "http://127.0.0.1:8000/api";
  }
}
