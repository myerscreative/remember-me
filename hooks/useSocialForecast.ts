"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getSocialForecast, type ForecastData } from "@/app/actions/get-social-forecast";

export function useSocialForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: forecast, error } = await getSocialForecast();
      if (error) throw new Error(String(error));
      setData(forecast);
    } catch (err) {
      toast.error("Failed to load social forecast");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { data, isLoading, refetch: fetchForecast };
}
