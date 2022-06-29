(() => {

    $(() => {

        $("#loadingSpinnerOnLoad").css("display", "none");
        fadeInSlogan();
        addCoinsToArray();

        $("#coinsButton").click(() => {
            clearAndRemoveErrors();
            addCoinsToArray();
            coinsMapOfPricesAndImage = new Map();
        });

        $("#reportButton").click(() => {
            $("#searchContainer").html("");
            clearAndRemoveErrors();
            createChartOfWatchedCoins();
        });

        $("#aboutButton").click(() => {
            $("#searchContainer").html("");
            clearAndRemoveErrors();
            addAboutMe();
        });

        $(document).on("change", ".loaded-checkbox", (e) => {
            onChangeOfCheckbox(e.target);
        });

        $(document).on("click", ".more-info-button", (e) => {
            onMoreInfoClicked({ name: e.target.name, id: e.target.id });
        });

    });
})();

const SLOGAN_FADE_IN_MILLISECONDS = 500;
const MAX_WATCHLIST_COINS = 5;
const WATCHLIST_CHART_REFRESH_INTERVAL = 2000;
const MORE_INFO_CACHED_DURATION = 120000;

let coinsArray = new Array();
let intervalIdArray = new Array();
let moreInfoOpenedCoin = new Set();
let coinsMapOfPricesAndImage = new Map();
let watchlistCoinsPriceMap = new Map();
let coinsMap = new Map();
let watchlistSet;
let intervalId;

function fadeInSlogan() {
    $("#sloganFirstPart").css("display", "none");
    $("#sloganFirstPart").css("visibility", "visible");
    $("#sloganFirstPart").fadeIn(SLOGAN_FADE_IN_MILLISECONDS, () => {

        $("#sloganThirdPart").css("visibility", "hidden");
        $("#sloganThirdPart").css("display", "inline");

        $("#sloganSecondPart").css("display", "none");
        $("#sloganSecondPart").css("visibility", "visible");

        $("#sloganSecondPart").fadeIn(SLOGAN_FADE_IN_MILLISECONDS, () => {

            $("#sloganThirdPart").css("display", "none");
            $("#sloganThirdPart").css("visibility", "visible");
            $("#sloganThirdPart").fadeIn(SLOGAN_FADE_IN_MILLISECONDS);

        });
    });
}

function watchlistSetExistence() {
    if (localStorage["watchlistSet"]) {
        return watchlistSet = new Set(JSON.parse(localStorage.getItem("watchlistSet")));
    } else {
        return watchlistSet = new Set();
    }
}

function clearAllIntervalsOfChart() {
    for (let intervalId of intervalIdArray) {
        clearInterval(intervalId);
    }

    intervalIdArray = new Array();
}

function maxHeightOfCoinContainer() {
    // The purpose here is to determine the height between the search container and the bottom of the page
    // That way the height of the div is exactly the height that's in between

    return $(window).height() - ($(".slogan-heading-container").outerHeight(true) + $("#searchContainer").outerHeight(true) + $(".top-buttons-container").outerHeight(true));
}

function maxHeightOfChartContainer() {
    return $(window).height() - ($(".slogan-heading-container").outerHeight(true) + $(".top-buttons-container").outerHeight(true)) - (parseFloat($("#chartContainer").css("margin-top")) + parseFloat($("#chartContainer").css("margin-bottom")));
}

function loadingSpinnerOnLoad() {
    let spinnerDiv = `<div class="loading-spinner onload-spinner" id="loadingSpinnerOnLoad"></div>`;

    let divHeight = maxHeightOfCoinContainer();
    let spinnerHeight = maxHeightOfCoinContainer() / 2;

    $("body").append(spinnerDiv);
    $('.onload-spinner').css("height", `${divHeight}px`);
    $(".loading-spinner").css("background-size", `${spinnerHeight}px`);
}

function clearAndRemoveErrors() {
    $("#coinsContainer").html("");
    $("#aboutContainer").html("");
    $("#noResults").remove();
    $("#emptySubText").remove();
    $("#chartContainer").remove();
    clearAllIntervalsOfChart();
    $("#aboutContainer").css("display", "none");
}

function onChangeOfCheckbox(clickedCheckbox) {

    if (clickedCheckbox.checked) {
        if (watchlistSet.size < MAX_WATCHLIST_COINS) {
            watchlistSet.add(clickedCheckbox.id);
            localStorage.setItem("watchlistSet", JSON.stringify([...watchlistSet]));

        } else {
            $(`#${clickedCheckbox.id}`).prop("checked", false);
            maxWatchlistCoinModal(clickedCheckbox.id);
        }

    } else {
        watchlistSet.delete(clickedCheckbox.id);
        localStorage.setItem("watchlistSet", JSON.stringify([...watchlistSet]));
    }
}

function addSearchTextboxAndButton() {
    $("#searchContainer").html("");

    let searchTextboxAndButtonDiv = `<input type="text" class="search-textbox" id="searchSubText" maxlength="3" placeholder="Search a coin symbol..." />
    <button class="search-button" id="searchButton">Search!</button>`;

    $("#searchContainer").append(searchTextboxAndButtonDiv);

    $("#searchSubText").on('keydown', () => {
        setTimeout(() => {
            searchSubText();
        }, 1);
    });
}

function addCoinsToArray() {
    addSearchTextboxAndButton();
    watchlistSetExistence();
    loadingSpinnerOnLoad();

    let coinListURL = "https://api.coingecko.com/api/v3/coins";

    $.get(coinListURL)
        .then((coins) => {

            for (let [i] of coins.entries()) {
                coinsArray[i] = { id: coins[i].id, symbol: coins[i].symbol, name: coins[i].name, market_data: { market_cap_rank: coins[i].market_data.market_cap_rank } };
                addCoinsToUI(coins[i]);
            }

            $("#loadingSpinnerOnLoad").css("display", "none");
            $("#loadingSpinnerOnLoad").remove();
        })

        .catch(() => {
            console.error("Failed to get data!");
            alert("Failed to get data!");
        });
}

function addCoinsToUI(coin) {
    let coinName = coin.name;
    let coinSymbol = coin.symbol.toUpperCase();
    let coinId = coin.id;
    let coinMarketCapRanking = coin.market_data.market_cap_rank;

    let coinCard = `<div class="coin-card">

    <div class="form-check form-switch add-to-watchlist-checkbox">
        <input class="form-check-input loaded-checkbox" type="checkbox" role="switch" id="${coinSymbol}" ${coinExistenceInWatchlist(coinSymbol)} />
    </div>

    <span class="coin-inner-info">
    <label class="coin-market-cap">#${coinMarketCapRanking}</label>

        <button id="${coinSymbol}" name="${coinId}" class="more-info-button btn btn-primary" data-bs-toggle="collapse" aria-expanded="false" data-bs-target="#${coinId}PriceContainer">More Info</button>
        <label class="coin-name">${coinName}</label>
        <label class="coin-symbol">${coinSymbol}</label>

        <div class="collapse coin-prices-and-image-container" id="${coinId}PriceContainer">
            <div class="coin-prices-and-image">
                <div class="flex-container" id="${coinId}Card">
                    <div class="flex-items coin-image" id="${coinId}Image"></div>
                    <div class="flex-items coin-price" id="${coinId}Price"></div>
                </div>
            </div>
        </div>
    </span>`;

    $("#coinsContainer").append(coinCard);
}

function searchSubText() {
    let subText = $("#searchSubText").val().trim().toLowerCase();
    let searchContainer = $("#searchContainer");

    $("#emptySubText").remove();
    $("#noResults").remove();

    let filteredCoinsArray = coinsArray.filter(coin => coin.symbol.includes(subText));

    if (filteredCoinsArray.length == 0) {
        $("#coinsContainer").html("");

        let errorMessage = `<span class="error-message alert alert-danger" id="noResults">No results were found!
            <label class="error-message-dismiss">Please click here to reload the coins.</label></span>`;
        searchContainer.append(errorMessage);

        $("#noResults").click(() => {
            $("#coinsButton").click();
        });

    } else {
        $("#coinsContainer").html("");

        for (let coin of filteredCoinsArray) {
            addCoinsToUI(coin);
        }
    }
}

function coinExistenceInWatchlist(coin) {
    if (watchlistSet.has(coin)) {
        return "checked";
    }
    return "";
}

function addCoinToWatchList(coin) {
    let checkboxStatus = $(`#${coin}`).prop("checked");

    if (checkboxStatus) {
        if (watchlistSet.size < MAX_WATCHLIST_COINS) {
            watchlistSet.add(coin);
            localStorage.setItem("watchlistSet", JSON.stringify([...watchlistSet]));

        } else {
            $(`#${coin}`).prop("checked", false);
            maxWatchlistCoinModal(coin);
        }

    } else {
        watchlistSet.delete(coin);
        localStorage.setItem("watchlistSet", JSON.stringify([...watchlistSet]));
    }
}

function numberFormat(coin, currencyName) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyName, minimumFractionDigits: 0, maximumFractionDigits: 5 }).format(coin);
}

function onMoreInfoClicked(coin) {
    let coinName = coin.name;

    if (isMoreInfoOpen(coinName)) {
        moreInfoOpenedCoin.delete(coinName);
    } else {
        moreInfoOpenedCoin.add(coinName);
    }

    coinExistenceInMap(coin);
}

function coinExistenceInMap(coin) {
    let coinName = coin.name;

    if (coinsMapOfPricesAndImage.has(coinName)) {
        let coin = coinsMapOfPricesAndImage.get(coinName);
        $(`#${coinName}Image`).css(`background-image`, `url(${coin.Image})`);
        $(`#${coinName}Price`).html(`${coin.USD}<br />${coin.EUR}<br />${coin.ILS}`);

    } else {
        addLoadingSpinnerOnMoreInfo(coinName);
        onMoreInfoClickedGetData(coinName);
    }
}

function addLoadingSpinnerOnMoreInfo(coin) {
    let loadingSpinner = `<div class="text-center loading-spinner" id="${coin}LoadingSpinnerOnMoreInfoClicked"></div>`;

    $(`#${coin}PriceContainer`).append(loadingSpinner);
    $(`#${coin}LoadingSpinnerOnMoreInfoClicked`).css("margin-top", "-96px").css("height", "96px").css("background-size", "80px");
}

function isMoreInfoOpen(coin) {
    if (moreInfoOpenedCoin.has(coin)) {
        return true;
    }
    return false;
}

function onMoreInfoClickedGetData(coin) {

    $(`#${coin}LoadingSpinnerOnMoreInfoClicked`).css("display", "block");

    let coinListURL = `https://api.coingecko.com/api/v3/coins/${coin}`;

    $.get(coinListURL)
        .then((coin) => {
            let coinImage = coin.image.large;
            let coinPriceInUSD = numberFormat(coin.market_data.current_price.usd, "USD");
            let coinPriceInEUR = numberFormat(coin.market_data.current_price.eur, "EUR");
            let coinPriceInILS = numberFormat(coin.market_data.current_price.ils, "ILS");
            let coinId = coin.id;

            saveMoreInfoCoinInCache({ id: coinId, USD: coinPriceInUSD, EUR: coinPriceInEUR, ILS: coinPriceInILS, Image: coinImage });
            addMoreInfoCoinToUI(coinId);

            $(`#${coinId}LoadingSpinnerOnMoreInfoClicked`).css("display", "none");
            $(`#${coinId}LoadingSpinnerOnMoreInfoClicked`).remove();
        })

        .catch(() => {
            console.error("Failed to get data!");
            alert("Failed to get data!");
        });
}

function saveMoreInfoCoinInCache(coin) {
    let coinId = coin.id;

    coinsMapOfPricesAndImage.set(coinId, { USD: coin.USD, EUR: coin.EUR, ILS: coin.ILS, Image: coin.Image });

    setTimeout(() => {
        deleteCoinInfoFromCache(coin.id);
    }, MORE_INFO_CACHED_DURATION);
}

function deleteCoinInfoFromCache(coin) {
    coinsMapOfPricesAndImage.delete(coin);
    $(`#${coin}PriceContainer`).collapse("hide");

    setTimeout(() => {
        $(`#${coin}Image`).removeAttr(`style`);
        $(`#${coin}Price`).html(``);
    }, 250);
}

function addMoreInfoCoinToUI(coin) {
    let priceInUSD = coinsMapOfPricesAndImage.get(coin).USD;
    let priceInEUR = coinsMapOfPricesAndImage.get(coin).EUR;
    let priceInILS = coinsMapOfPricesAndImage.get(coin).ILS;
    let coinImage = coinsMapOfPricesAndImage.get(coin).Image;

    $(`#${coin}Image`).removeAttr(`style`);
    $(`#${coin}Price`).html(``);
    $(`#${coin}Image`).css(`background-image`, `url(${coinImage})`);
    $(`#${coin}Price`).html(`${priceInUSD}<br />${priceInEUR}<br />${priceInILS}`);
}

function maxWatchlistCoinModal(exceedingCoin) {
    let tempWatchlistSet = new Set();
    tempWatchlistSet = watchlistSet;

    let watchlistCoinsContainer = "";
    let exceedingCoinContainer = "";

    for (let watchedCoin of watchlistSet) {
        watchlistCoinsContainer += `
        <div class="max-checkbox-container flex-container">
            <div class="max-checkbox-flex-item">${watchedCoin}</div>
            <div class="max-checkbox-flex-item">
                <div class="form-switch">
                    <input class="form-check-input modal-checkbox" type="checkbox" role="switch" id="${watchedCoin}" checked />
                </div>
            </div>
        </div>`;
    }

    exceedingCoinContainer = `
    <div class="max-checkbox-container flex-container">
        <div class="max-checkbox-flex-item">${exceedingCoin}</div>
        <div class="max-checkbox-flex-item">
            <div class="form-switch">
                <input class="form-check-input modal-checkbox" type="checkbox" role="switch" id="${exceedingCoin}"
                    name="${exceedingCoin}" disabled />
            </div>
        </div>
    </div>`;

    let modalBox = `
    <div class="modal fade" id="maxWatchlistModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="maxWatchlistModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="maxWatchlistModalLabel">You reached your watchlist capacity!</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="discardChanges"></button>
                </div>
                <div class="modal-body">
                    Please choose whether you would like to remove any coin:
                    <hr />
                    ${watchlistCoinsContainer}
                    <hr />
                    ${exceedingCoinContainer}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="updateWatchlist">Update Watchlist</button>
                </div>
            </div>
        </div>
    </div>`;

    $("body").append(modalBox);

    let reachedMaxWatchlistModal = $(`#maxWatchlistModal`);
    reachedMaxWatchlistModal.modal("show");

    $(document).on("change", ".modal-checkbox", (e) => {
        let clickedCheckbox = e.target;

        if (clickedCheckbox.checked) {

            if (tempWatchlistSet.size < MAX_WATCHLIST_COINS) {
                tempWatchlistSet.add(clickedCheckbox.id);
            } else {
                $(`input[name="${exceedingCoin}"]`).prop("disabled", "disabled");
                $(`input[name="${exceedingCoin}"]`).prop("checked", "");

                tempWatchlistSet.add(clickedCheckbox.id);
                tempWatchlistSet.delete(exceedingCoin);
            }
        } else {
            tempWatchlistSet.delete(clickedCheckbox.id);

            if ($(`input[name="${exceedingCoin}"]`).prop("disabled")) {
                $(`input[name="${exceedingCoin}"]`).prop("disabled", "");
                $(`input[name="${exceedingCoin}"]`).prop("checked", "checked");
                tempWatchlistSet.add(exceedingCoin);
            }
        }

        if (tempWatchlistSet.size == MAX_WATCHLIST_COINS && !$(`input[name="${exceedingCoin}"]`).prop("checked")) {
            $(`input[name="${exceedingCoin}"]`).prop("disabled", "disabled");
            $(`input[name="${exceedingCoin}"]`).prop("checked", "");
        }

    });

    $("#updateWatchlist").click(() => {
        modalUpdateWatchlist(tempWatchlistSet);
    });

    $("#discardChanges").click(() => {
        modalDiscardChanges();
    });
}

function modalUpdateWatchlist(maxWatchlistSet) {
    $(`#maxWatchlistModal`).modal("hide");
    $(`#maxWatchlistModal`).remove();
    localStorage.setItem("watchlistSet", JSON.stringify([...maxWatchlistSet]));
    clearAndRemoveErrors();
    addCoinsToArray();
}

function modalDiscardChanges() {
    $(`#maxWatchlistModal`).remove();
    $("#coinsContainer").html("");
    addCoinsToArray();
}

function convertSetToArray(set) {
    return Array.from(new Set(JSON.parse(set)));
}

function createChartOfWatchedCoins() {
    let watchlistSet = convertSetToArray(localStorage.getItem("watchlistSet"));

    if (watchlistSet.length == 0) {
        let searchContainer = $("#searchContainer");

        let errorMessage = `
        <span class="error-message alert alert-danger" id="emptySubText">
            Please add at least one coin to your watchlist and then try again.
        </span>`;

        searchContainer.append(errorMessage);

    } else {

        let chartPriceArray = new Array();
        let coinsDataArray = new Array();
        let dataInfo = "";

        let div = `<div id="chartContainer" class="watched-coins-chart"></div>`;

        $("body").append(div);
        $("#chartContainer").css("height", maxHeightOfChartContainer());

        for (let [i] of watchlistSet.entries()) {

            chartPriceArray[i] = new Array();

            dataInfo = {
                type: "spline",
                name: watchlistSet[i],
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                yValueFormatString: "$#,###.####",
                dataPoints: chartPriceArray[i]
            };

            coinsDataArray.push(dataInfo);
        }

        let watchedCoinsPricesURL = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${watchlistSet}&tsyms=USD`;

        let chart = new CanvasJS.Chart("chartContainer", {
            title: {
                text: "Prices of your watched coins"
            },
            axisX: {
                title: "Time",
                valueFormatString: "HH:mm:ss",
                suffix: ""
            },
            axisY: {
                title: "Price",
                titleFontColor: "#4F81BC",
                prefix: "$",
                lineColor: "#4F81BC",
                tickColor: "#4F81BC"
            },
            axisY2: {
                title: "Time",
                titleFontColor: "#C0504E",
                suffix: "HH:mm:ss",
                lineColor: "#C0504E",
                tickColor: "#C0504E"
            },
            backgroundColor: "#d9faff",
            legend: {
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: coinsDataArray
        });
        chart.render();

        intervalId = setInterval(function renderChart() {
            $.when(
                $.getJSON(watchedCoinsPricesURL, (data) => {

                    for (let [i, coinName] of watchlistSet.entries()) {
                        chartPriceArray[i].push({ x: new Date(), y: data[coinName].USD });
                    }

                })
            ).then(() => {
                chart.render();
            });

            return renderChart;
        }(), WATCHLIST_CHART_REFRESH_INTERVAL);

        intervalIdArray.push(intervalId);

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }
    }
}

function addAboutMe() {
    $("#aboutContainer").css("display", "flex");

    let aboutMe = `
    <div class="flex-items" id="myPhoto">
        <img src="./images/me.png" class="about-me-photo" />
    </div>

    <div id="aboutMeText">
        <div class="about-me-text">Hi, my name is Daniel!</div>
        <div class="about-me-text">I was born on November 5th, 1995 and I currently live in Gan Yavne, a small town
            near Ashdod.</div>
        <div class="about-me-text mb-15">From a very young age I was fascinated with computers, how they work and how can
            I use them to create a product like a website or a program.</div>
        <div class="about-me-text">In this intriguing project, I learned a lot about using jQuery and how to
            implement it for my
            needs.</div>
        <div class="about-me-text">At the first glance, when I just saw the instructions, I had no idea how to
            start it. Should I start
            with the design? Should I start with the algorithm? I was confused, but then I decided to write
            everything on a piece of paper. I knew I had to plan this project ahead, and work on it only after
            having a plan.</div>
        <div class="about-me-text">I've had ups and downs, had some obstacles and frustration but eventually, I
            believe I did the
            best I can do at this point of the course.</div>
    </div>`;

    $("#aboutContainer").append(aboutMe);

    $("#aboutMeText").css("visibility", "hidden");
    $("#myPhoto").hide().fadeIn(500, () => {

        $("#aboutMeText").css("display", "none");
        $("#aboutMeText").css("visibility", "visible");
        $("#aboutMeText").fadeIn(500, () => {
            $("#aboutMeText").css("display", "block");
        });

    });
}