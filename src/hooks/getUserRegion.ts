export function getUserRegion(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation is not supported by this browser."));
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    localStorage.setItem("location",(data.display_name));
                    const region_area=data.display_name;
                    const region = data.address?.country_code?.toUpperCase() || "US";
                    resolve(region_area);
                } catch (error) {
                    reject(error);
                }
            },
            (error) => {
                reject(error);
            }
        );
    });
}