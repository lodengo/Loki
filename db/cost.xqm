module namespace cost = 'cost';

declare updating function cost:createFile($data){
  let $fileid:= random:uuid()
  let $costId := random:uuid()
  let $type := $data/type/text()
  let $n := copy $n := doc('fees')//node()[name()=$type]
  modify(
    for $fee in $n//fee return    
    insert node <fee><file>{$fileid}</file><costId>{$costId}</costId><costType>{$type}</costType><id>{random:uuid()}</id></fee>/node() into $fee
  )
  return $n
  let $cost :=
  <cost>
  <id>{$costId}</id>
  {$data/node()}
  <fees>{$n/node()}</fees>
  </cost>  
 
  return(     
    db:create($fileid, $cost, $fileid),       
    db:output(<result><file>{$fileid}</file><id>{$costId}</id></result>)
  )  
};

declare updating function cost:insertCost($data, $file as xs:string*, $parentid as xs:string*){
  let $costId := random:uuid()
  let $type := $data/type/text()
  let $n := copy $n := doc('fees')//node()[name()=$type]
  modify(
      for $fee in $n//fee return    
      insert node <fee><file>{$file}</file><costId>{$costId}</costId><costType>{$type}</costType><id>{random:uuid()}</id></fee>/node() into $fee
  )
  return $n
  let $cost :=
  <cost>
  <id>{$costId}</id>
  {$data/node()}
  <fees>{$n/node()}</fees>
  </cost>
  
  let $parent := doc($file)//cost[id=$parentid] return(
      insert node $cost into $parent,     
      db:output(<result><id>{$costId}</id></result>) 
  )   
};

declare function cost:feesToFlushOnCostCreate($file, $costId){
  let $cost := doc($file)//cost[id=$costId]
  let $cost_fees := $cost//fee 
  let $cost_parent_fees_cc := $cost/../fees//fee[matches(feeExpr, "cc")]
  let $cost_sibling := $cost/../cost[id != $costId]
  let $cost_sibling_fees_cs := $cost_sibling/fees//fee[matches(feeExpr, "cs")]
  return <fees>{($cost_fees,$cost_parent_fees_cc,$cost_sibling_fees_cs)}</fees>
};

declare updating function cost:createRefsTo($file, $fromFeeId, $toIds){
  let $fee := doc($file)//fee[id=$fromFeeId]
  return for $toId in $toIds/id/text() return(
    let $toNode := doc($file)//id[text()=$toId]/.. 
    return (
      if($fee/refTo[text()=$toId])
      then ()
      else insert node <refTo>{$toId}</refTo>into $fee
      ,
      if($toNode/refFrom[text()=$fromFeeId]) then () 
      else insert node <refFrom>{$fromFeeId}</refFrom> into $toNode
    )   
  )  
};

declare updating function cost:removeRefsTo($file, $fromFeeId, $toIds){
  let $fee := doc($file)//fee[id=$fromFeeId]
  return for $toId in $toIds/id/text() return(
    let $toNode := doc($file)//id[text()=$toId]/.. 
    return (
      delete node $fee/refTo[text()=$toId],    
      delete node $toNode/refFrom[text()=$fromFeeId]
    )   
  )  
};

declare updating function cost:setFeeResult($file, $feeId, $result){
  replace value of node doc($file)//fee[id=$feeId]/feeResult with $result
};

declare function cost:getFee($file, $id){
  doc($file)//fee[id=$id]
};

declare function cost:getFees($file, $ids){
  <fees>{
  for $id in $ids/id/text() return
  doc($file)//fee[id=$id]
  }</fees>
};

declare function cost:_C($file, $costId, $prop){
   <results>{
  let $cost := doc($file)//cost[id=$costId]
  return <result><id>{$costId}</id><value>{$cost/node()[name()=$prop]/text()}</value></result>
   }</results>
};

declare function cost:_CF($file, $costId, $feeName){
   <results>{
  let $fee := doc($file)//cost[id=$costId]/fees//fee[feeName=$feeName]
  return <result><id>{$fee/id/text()}</id><value>{$fee/feeResult/text()}</value></result>
   }</results>
};

declare function cost:_CC($file, $costId, $type, $prop){
  <results>{
  let $costs := doc($file)//cost[id=$costId]/cost[type=$type]
  for $cost in $costs return
  <result><id>{$cost/id/text()}</id><value>{$cost/node()[name=$prop]/text()}</value></result>
  }</results>
 
};

declare function cost:_CCF($file, $costId, $type, $feeName){
  <results>{
  let $fees := doc($file)//cost[id=$costId]/cost[type=$type]/fees//fee[feeName=$feeName]
  for $fee in $fees return
   <result><id>{$fee/id/text()}</id><value>{$fee/feeResult/text()}</value></result>
   }</results>
};

declare function cost:_CS($file, $costId, $prop){
  <results>{
  let $costs := doc($file)//cost[id=$costId]/../cost[id != $costId]
  for $cost in $costs return
   <result><id>{$cost/id/text()}</id><value>{$cost/node()[name()=$prop]/text()}</value></result>
  }</results>
};

declare function cost:_CSF($file, $costId, $feeName){
  <results>{
  let $fees := doc($file)//cost[id=$costId]/../cost/fees//fee[feeName=$feeName]
  for $fee in $fees return
   <result><id>{$fee/id/text()}</id><value>{$fee/feeResult/text()}</value></result>
  }</results>
};

declare function cost:self_parent($cost, $prop){
  let $node := $cost/node()[name()=$prop] return
  if($node) then  <result><id>{$cost/id/text()}</id><value>{$node/text()}</value></result>
  else cost:self_parent($cost/.., $prop)
};

declare function cost:_CAS($file, $costId, $prop){
  <results>{
  let $cost := doc($file)//cost[id=$costId]
  return cost:self_parent($cost, $prop)
  }</results>
};

