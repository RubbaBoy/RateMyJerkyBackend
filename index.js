/**
 * Runnable on Cloudflare Workers
 */

// The same as in the app
const LOCATIONS = ['The Commons', 'Crossroads Market', 'Crossroads Cafe', 'Vending Machine', 'Corner Store', 'Sol\'s Underground'];

async function handleRequest(request) {
    let url = new URL(request.url)
    let splitted = url.pathname.substr(1).split('/')

    if (splitted[0] === 'review') {
        return review(request)
    } else if (splitted[0] === 'list') {
        return list(request)
    } else {
        return new Response('Invalid request')
    }
}

async function review(request) {
    if (request.method !== 'POST') {
        return new Response('Only POST please')
    }

    let json = await request.json();

    let location = json['location'];
    if (!LOCATIONS.includes(location)) {
        return new Response('Invalid location!')
    }

    await RATINGS.put('review:' + location + ':' + Date.now(), JSON.stringify({
        'name': json['name'],
        'barcode': json['barcode'],
        'location': location,
        'stars': json['stars'],
        'review': json['review'],
    }))

    return new Response('ok')
}

// ?location=LOC
async function list(request) {
    console.log(request.url);
    let url = new URL(request.url)
    let query = url.searchParams
    if (request.method !== 'GET') {
        return new Response('Only GET please')
    }

    let result;

    let location = query.get('location')
    if (location !== null && location.trim() !== '') {
        result = await RATINGS.list({'prefix': 'review:' + location + ':'})
    } else {
        result = await RATINGS.list()
    }

    let reviews = {}
    let keys = result.keys
    for (let bruh in keys) {
        let key = keys[bruh]['name']
        reviews[key] = await RATINGS.get(key, 'json')
    }

    return new Response(JSON.stringify(reviews))
}

addEventListener("fetch", event => {
    return event.respondWith(handleRequest(event.request))
})
