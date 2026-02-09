# 04. API Endpoints

---

## Overview

Backend uses **Supabase** directly. No separate API server — frontend queries Supabase Client directly.

For complex logic, Supabase Edge Functions can be used (not used in MVP).

---

## Supabase Direct Queries

### 1. Soul List

```typescript
// Full list (public info only)
const { data: souls } = await supabase
  .from('souls')
  .select(`
    id,
    token_id,
    name,
    description,
    image_url,
    conversation_style,
    knowledge_domain,
    generation,
    creator_address,
    created_at
  `)
  .order('created_at', { ascending: false })
  .limit(50)
```

### 2. Soul Detail

```typescript
// Public info
const { data: soul } = await supabase
  .from('souls')
  .select('*')
  .eq('token_id', tokenId)
  .single()

// Private info (after buyer verification — handled in frontend)
// NFT ownership verified on-chain
```

### 3. Soul Stats (Marketplace Table)

```typescript
const { data: stats } = await supabase
  .from('soul_stats')  // View
  .select('*')
  .order('total_volume', { ascending: false })
  .limit(20)
```

### 4. Active Listings

```typescript
// Active listings for a specific Soul
const { data: listings } = await supabase
  .from('listings')
  .select('*')
  .eq('soul_id', soulId)
  .eq('is_active', true)
  .order('price', { ascending: true })

// All active listings
const { data: allListings } = await supabase
  .from('listings')
  .select(`
    *,
    souls (
      name,
      image_url,
      conversation_style
    )
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

### 5. Lineage Query

```typescript
// Ancestors (up to Origin)
const { data: ancestors } = await supabase
  .rpc('get_ancestors', { leaf_id: soulId })

// Descendants (from a specific Soul)
const { data: descendants } = await supabase
  .rpc('get_descendants', { root_id: soulId })

// Full tree (from Origin)
async function getFullLineage(tokenId: number) {
  // 1. Get the Soul
  const { data: soul } = await supabase
    .from('souls')
    .select('id, parent_id')
    .eq('token_id', tokenId)
    .single()

  // 2. Find Origin
  let originId = soul.id
  if (soul.parent_id) {
    const { data: ancestors } = await supabase
      .rpc('get_ancestors', { leaf_id: soul.id })
    originId = ancestors[ancestors.length - 1].id
  }

  // 3. Get all descendants from Origin
  const { data: tree } = await supabase
    .rpc('get_descendants', { root_id: originId })

  return tree
}
```

### 6. User Souls

```typescript
// Souls created by user
const { data: created } = await supabase
  .from('souls')
  .select('*')
  .eq('creator_address', userAddress)
  .order('created_at', { ascending: false })

// Souls purchased by user (requires on-chain data matching)
// -> Filter after on-chain balanceOf query in frontend
```

### 7. Transaction History

```typescript
// Transaction history for a specific Soul
const { data: txs } = await supabase
  .from('transactions')
  .select('*')
  .eq('soul_id', soulId)
  .order('created_at', { ascending: false })
  .limit(50)

// All recent transactions
const { data: recentTxs } = await supabase
  .from('transactions')
  .select(`
    *,
    souls (name, image_url)
  `)
  .order('created_at', { ascending: false })
  .limit(20)
```

---

## Data Insertion

### 1. Soul Creation (after minting)

```typescript
// Save metadata to DB after on-chain minting succeeds
const { data, error } = await supabase
  .from('souls')
  .insert({
    token_id: tokenId,
    name: formData.name,
    description: formData.description,
    image_url: formData.imageUrl,
    conversation_style: formData.style,
    knowledge_domain: formData.domains,
    system_prompt: formData.systemPrompt,
    behavior_traits: formData.traits,
    temperature: formData.temperature,
    generation: 0,
    creator_address: userAddress
  })
  .select()
  .single()
```

### 2. Fork Creation

```typescript
// Save to DB after on-chain Fork
const { data, error } = await supabase
  .from('souls')
  .insert({
    token_id: newTokenId,
    name: formData.name,
    description: formData.description,
    image_url: formData.imageUrl,
    conversation_style: parentSoul.conversation_style,
    knowledge_domain: parentSoul.knowledge_domain,
    // Fork-specific fields
    additional_prompt: formData.additionalPrompt,
    added_traits: formData.addedTraits,
    temperature_override: formData.temperatureOverride,
    fork_note: formData.forkNote,
    parent_id: parentSoul.id,
    generation: parentSoul.generation + 1,
    creator_address: userAddress
  })
  .select()
  .single()
```

### 3. Listing Creation (event mirroring)

```typescript
// After on-chain Listed event detected
const { error } = await supabase
  .from('listings')
  .insert({
    listing_id: event.args.listingId,
    soul_id: soulUuid,
    token_id: event.args.tokenId,
    seller_address: event.args.seller,
    price: event.args.pricePerUnit.toString(),
    amount: event.args.amount,
    remaining_amount: event.args.amount,
    is_active: true
  })
```

### 4. Transaction Record

```typescript
// Record after on-chain event
const { error } = await supabase
  .from('transactions')
  .insert({
    soul_id: soulUuid,
    listing_id: listingId,
    tx_hash: txHash,
    tx_type: 'buy', // 'create', 'fork', 'list', 'buy', 'cancel'
    from_address: buyer,
    to_address: seller,
    price: price.toString(),
    amount: amount
  })
```

---

## Realtime Subscription (optional)

```typescript
// Detect new listings in realtime
const subscription = supabase
  .channel('listings')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'listings' },
    (payload) => {
      console.log('New listing:', payload.new)
      // Update UI
    }
  )
  .subscribe()

// Unsubscribe
subscription.unsubscribe()
```

---

## On-chain Event → DB Sync

Pattern: Record to DB after transaction succeeds in frontend:

```typescript
async function handleBuy(listingId: number, amount: number) {
  // 1. On-chain transaction
  const tx = await soulSale.buy(listingId, amount)
  const receipt = await tx.wait()

  // 2. Extract data from event
  const event = receipt.logs.find(/* Sold event */)

  // 3. DB update
  await supabase
    .from('listings')
    .update({
      remaining_amount: listing.remaining_amount - amount,
      is_active: listing.remaining_amount - amount > 0
    })
    .eq('listing_id', listingId)

  await supabase
    .from('transactions')
    .insert({
      tx_hash: receipt.hash,
      tx_type: 'buy',
      // ...
    })
}
```

---

## Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('souls')
    .select('*')
    .eq('token_id', tokenId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      throw new Error('Soul not found')
    }
    throw error
  }

  return data
} catch (e) {
  console.error('Failed to fetch soul:', e)
  throw e
}
```
